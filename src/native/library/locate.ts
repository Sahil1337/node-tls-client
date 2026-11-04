/**
 * Finds the tls-client shared library on disk, downloading it when this
 * version has no cached copy: which release (`binary`), the cached filename,
 * and the offline fallback to an older cached copy.
 */

import path from "path";
// Sync on purpose: async fs runs on Node's libuv threadpool and would start
// it, and with node-tls-client's binary nothing else needs that pool. These
// calls run once per initTLS() and take microseconds.
import { Stats, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import os from "os";
import { NativeBinary } from "../../types/native";
import {
  TlsClientError,
  errorMessage,
  logger,
  packageVersion,
} from "../../utils";
import { LibraryAsset, platformAsset } from "./assets";
import { HttpRequest, ReleaseDownloader } from "./downloader";
import { loadedLibrary } from "./load";

/** Where each `binary` is downloaded from, and the tag in its cached filename. */
const SOURCES: Record<NativeBinary, { repo: string; tag: string }> = {
  upstream: { repo: "bogdanfinn/tls-client", tag: "" },
  "node-tls-client": { repo: "Sahil1337/tls-client", tag: "nodetls-" },
};

export interface LocateOptions {
  /** Directory holding the cached library. Default: `os.tmpdir()`. */
  dir?: string;
  /** Which release to use. Default: `"upstream"`. */
  binary?: NativeBinary;
  /** Injectable `https.request` (tests). */
  request?: HttpRequest;
}

/**
 * Ensure a shared library is available and return its path. For each source
 * tried: this version's cached file, else the newest release (downloaded),
 * else — with a warning — a binary cached by an earlier version, so an
 * offline upgrade keeps working. `binary: "node-tls-client"` tries our
 * release first and falls back to upstream's with a warning. Throws
 * `TlsClientError` when none of that is possible. Once a library is loaded,
 * returns its path without looking at disk or the network.
 */
export async function locateLibrary(opts: LocateOptions = {}): Promise<string> {
  const dir = path.resolve(opts.dir ?? os.tmpdir());
  const loaded = loadedLibrary();
  if (loaded) {
    // Only an explicit `dir` or `binary` is worth a warning: with none given,
    // the user asked for nothing in particular, so the loaded copy is not a
    // surprise.
    if (opts.dir !== undefined && dir !== path.dirname(loaded.path)) {
      logger.warnOnce(
        "library-dir",
        `libraryDir ${dir} takes effect only after the process restarts: this process already loaded the tls-client library from ${path.dirname(loaded.path)} and keeps using it.`,
      );
    }
    const hasQueue = loaded.bindings.queue !== undefined;
    if (opts.binary && (opts.binary === "node-tls-client") !== hasQueue) {
      logger.warnOnce(
        "binary-loaded",
        `binary "${opts.binary}" takes effect only after the process restarts: this process already loaded ${hasQueue ? "node-tls-client's" : "upstream's"} tls-client library (${path.basename(loaded.path)}) and keeps using it.`,
      );
    }
    return loaded.path;
  }
  const asset = platformAsset();
  if (resolveBinary(opts.binary) === "node-tls-client") {
    try {
      return await locateFrom("node-tls-client", dir, asset, opts.request);
    } catch (e) {
      logger.warnOnce(
        "binary-fallback",
        `${errorMessage(e)} — using upstream's tls-client library instead, where each request holds a threadpool thread.`,
      );
    }
  }
  return locateFrom("upstream", dir, asset, opts.request);
}

/** `binary`, or `"upstream"` (with a warning) when it names no known source. */
function resolveBinary(binary: NativeBinary | undefined): NativeBinary {
  if (binary === undefined || binary === "upstream") return "upstream";
  if (binary === "node-tls-client") return binary;
  logger.warnOnce(
    "invalid-binary",
    `binary must be "upstream" or "node-tls-client", got ${JSON.stringify(binary)}; using "upstream".`,
  );
  return "upstream";
}

/** One source's cached file, else its newest release, else an older cached copy. */
async function locateFrom(
  binary: NativeBinary,
  dir: string,
  asset: LibraryAsset,
  request: HttpRequest | undefined,
): Promise<string> {
  const { repo, tag } = SOURCES[binary];
  // The package version is part of the name, so an upgrade downloads once and
  // never replaces a file another process may have loaded.
  const libPath = path.join(
    dir,
    `tls-client-${packageVersion}-${tag}${asset.name}`,
  );
  if (existsSync(libPath)) return libPath;

  try {
    mkdirSync(dir, { recursive: true });
    await new ReleaseDownloader({ repo, request }).download(
      asset.downloadNames,
      libPath,
    );
    return libPath;
  } catch (e) {
    const fallback = findCached(dir, asset, binary);
    if (!fallback) throw TlsClientError.from(e);
    logger.warn(
      `${errorMessage(e)} — using previously cached ${path.basename(fallback)} instead.`,
    );
    return fallback;
  }
}

/**
 * Newest previously cached binary for this platform from `binary`'s source:
 * older package versions, or for upstream also the ≤ 2.1.0 name.
 */
function findCached(
  dir: string,
  asset: LibraryAsset,
  binary: NativeBinary,
): string | null {
  const ours = `-${SOURCES["node-tls-client"].tag}${asset.name}`;
  const isCandidate = (file: string) =>
    binary === "node-tls-client"
      ? file.startsWith("tls-client-") && file.endsWith(ours)
      : file === asset.legacyName ||
        (file.startsWith("tls-client-") &&
          file.endsWith(`-${asset.name}`) &&
          !file.endsWith(ours));
  let best: { file: string; mtime: number } | null = null;
  for (const file of attempt(() => readdirSync(dir)) ?? []) {
    if (!isCandidate(file)) continue;
    const stat: Stats | null = attempt(() => statSync(path.join(dir, file)));
    if (stat?.isFile() && (!best || stat.mtimeMs > best.mtime)) {
      best = { file, mtime: stat.mtimeMs };
    }
  }
  return best ? path.join(dir, best.file) : null;
}

/** `fn()`, or `null` when it throws (a missing or unreadable file). */
function attempt<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}
