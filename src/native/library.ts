/**
 * Locates, downloads and loads the tls-client shared library. The only module
 * that imports koffi; native/client.ts imports it lazily from initTLS().
 */

import path from "path";
import fs from "fs/promises";
import os from "os";
import { KoffiFunction, config as koffiConfig, load } from "koffi";
import { TlsNativeLibrary } from "../types/native";
import {
  TlsClientError,
  errorMessage,
  exists,
  logger,
  packageVersion,
} from "../utils";
import { LibraryAsset, platformAsset } from "./assets";
import { HttpRequest, ReleaseDownloader } from "./downloader";

/**
 * koffi's hard `max_async_calls` ceiling (ffi.hh:20). koffi's running+queued
 * limit is raised to it so the semaphore, not koffi, is the throttle.
 */
const KOFFI_MAX_ASYNC_CALLS = 4096;
/** koffi keeps at most this many async memory pools resident (misc.md "Default settings"). */
const KOFFI_MAX_RESIDENT_POOLS = 16;

export interface LocateOptions {
  /** Directory holding the cached library. Default: `os.tmpdir()`. */
  dir?: string;
  /** Injectable `https.request` (tests). */
  request?: HttpRequest;
}

export interface LoadedLibrary {
  bindings: TlsNativeLibrary;
  /** koffi's `max_async_calls` in effect: the most native calls that may be in flight. */
  maxAsyncCalls: number;
}

/** Bindings are created once per library path and reused across re-inits. */
let loaded: { path: string; bindings: TlsNativeLibrary } | null = null;

/**
 * Ensure a shared library is available and return its path: this version's
 * cached file, else the newest upstream release (downloaded), else — with a
 * warning — any previously cached binary, so an offline upgrade keeps
 * working. Throws `TlsClientError` when none of that is possible.
 */
export async function locateLibrary(opts: LocateOptions = {}): Promise<string> {
  const dir = path.resolve(opts.dir ?? os.tmpdir());
  const asset = platformAsset();
  // The package version is part of the name, so an upgrade downloads once and
  // never replaces a file another process may have loaded.
  const libPath = path.join(dir, `tls-client-${packageVersion}-${asset.name}`);
  if (await exists(libPath)) return libPath;

  try {
    await fs.mkdir(dir, { recursive: true });
    await new ReleaseDownloader({ request: opts.request }).download(
      asset.downloadNames,
      libPath,
    );
    return libPath;
  } catch (e) {
    const fallback = await findCached(dir, asset);
    if (!fallback) throw TlsClientError.from(e);
    logger.warn(
      `${errorMessage(e)} — using previously cached ${path.basename(fallback)} instead.`,
    );
    return fallback;
  }
}

/**
 * Load the library at `libPath` (tuning koffi first) and bind its exports.
 * `expectedInFlight` sizes koffi's resident async memory pools.
 */
export function loadLibrary(
  libPath: string,
  expectedInFlight: number,
): LoadedLibrary {
  // Must run before load(): koffi's config is frozen once a library is loaded.
  const maxAsyncCalls = raiseAsyncLimit(expectedInFlight);
  if (loaded?.path !== libPath) {
    loaded = { path: libPath, bindings: bind(libPath) };
  }
  return { bindings: loaded.bindings, maxAsyncCalls };
}

function bind(libPath: string): TlsNativeLibrary {
  let library: ReturnType<typeof load>;
  try {
    library = load(libPath);
  } catch (e) {
    let message = `Failed to load the tls-client shared library at ${libPath}: ${errorMessage(e)}`;
    if (process.platform === "linux" && !hasGlibc()) {
      message +=
        ". This looks like a musl-based system (e.g. Alpine): this version only downloads glibc-linked binaries, so alpine/musl is not supported yet — use a glibc-based image such as node:<version>-slim.";
    }
    throw new TlsClientError(message);
  }

  return {
    request: promisify(library.func("request", "string", ["string"])),
    // Sync on purpose: natively a mutex-guarded map delete + C.free.
    freeMemory: library.func("freeMemory", "void", ["string"]) as (
      id: string,
    ) => void,
    destroyAll: promisify(library.func("destroyAll", "string", [])),
    destroySession: promisify(
      library.func("destroySession", "string", ["string"]),
    ),
  };
}

/**
 * Tune koffi for our call pattern: raise the async-call ceiling so the
 * semaphore (not koffi) throttles, and keep as many async memory pools
 * resident as we expect calls in flight, so steady-state requests reuse
 * pools instead of mmap/munmap-ing 256 KiB each. The setter throws once ANY
 * koffi library is loaded in the process (ffi.cc:102) — our own after a
 * destroyTLS()/initTLS() cycle, or a host app's — so read first and only
 * set when something is below target. Returns the call limit in effect.
 */
function raiseAsyncLimit(expectedInFlight: number): number {
  const current = koffiConfig();
  const max = current.max_async_calls ?? 256;
  const resident = current.resident_async_pools ?? 4;
  const residentTarget = Math.min(
    KOFFI_MAX_RESIDENT_POOLS,
    Math.max(1, Math.floor(expectedInFlight)),
  );
  if (max >= KOFFI_MAX_ASYNC_CALLS && resident >= residentTarget) return max;
  try {
    koffiConfig({
      max_async_calls: KOFFI_MAX_ASYNC_CALLS,
      resident_async_pools: Math.max(resident, residentTarget),
    });
    return KOFFI_MAX_ASYNC_CALLS;
  } catch (e) {
    logger.warnOnce(
      "koffi-config",
      `could not raise koffi max_async_calls to ${KOFFI_MAX_ASYNC_CALLS} (${errorMessage(e)}); in-flight native calls are capped at ${max}.`,
    );
    return max;
  }
}

/** Newest previously cached binary for this platform: older package versions or the ≤ 2.1.0 name. */
async function findCached(
  dir: string,
  asset: LibraryAsset,
): Promise<string | null> {
  const entries = await fs.readdir(dir).catch(() => [] as string[]);
  let best: { file: string; mtime: number } | null = null;
  for (const file of entries) {
    const candidate =
      file === asset.legacyName ||
      (file.startsWith("tls-client-") && file.endsWith(`-${asset.name}`));
    if (!candidate) continue;
    const stat = await fs.stat(path.join(dir, file)).catch(() => null);
    if (stat?.isFile() && (!best || stat.mtimeMs > best.mtime)) {
      best = { file, mtime: stat.mtimeMs };
    }
  }
  return best ? path.join(dir, best.file) : null;
}

/**
 * Promisify a koffi `.async` function: runs the (blocking cgo) call on a
 * libuv threadpool thread and resolves/rejects the Node-style callback.
 */
function promisify(f: KoffiFunction): (...args: string[]) => Promise<string> {
  return (...args) =>
    new Promise((resolve, reject) =>
      f.async(...args, (err: Error | null, result: string) =>
        err ? reject(err) : resolve(result),
      ),
    );
}

function hasGlibc(): boolean {
  try {
    const report = process.report?.getReport() as
      { header?: { glibcVersionRuntime?: string } } | undefined;
    return report?.header?.glibcVersionRuntime !== undefined;
  } catch {
    return true;
  }
}
