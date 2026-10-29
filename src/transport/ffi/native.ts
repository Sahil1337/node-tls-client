/**
 * Locates, downloads and loads the tls-client shared library.
 */

import path from "path";
import fs from "fs/promises";
import os from "os";
import { KoffiFunction, load as koffi } from "koffi";
import {
  FileInfo,
  PlatformMap,
  TlsNativeLibrary,
} from "../../interface/native";
import { HttpRequest, LibraryDownloader } from "../../utils/download";
import { packageVersion } from "../../utils/version";
import { TlsClientError } from "../../utils/tlsError";
import { logger } from "../../utils/logger";

export class LibraryHandler {
  private static readonly REPO = "bogdanfinn/tls-client";

  /**
   * Release asset names per platform. Upstream publishes two naming schemes
   * (xgo since 1.15, the hand-built legacy names up to 1.15.1); the current
   * one is tried first.
   */
  private static readonly ASSETS: PlatformMap = {
    darwin: {
      arm64: LibraryHandler.asset(
        "darwin-arm64.dylib",
        "tls-client-arm64.dylib",
        [
          LibraryHandler.xgo("darwin", "arm64", "dylib"),
          "tls-client-darwin-arm64-{version}.dylib",
        ],
      ),
      x64: LibraryHandler.asset("darwin-amd64.dylib", "tls-client-x86.dylib", [
        LibraryHandler.xgo("darwin", "amd64", "dylib"),
        "tls-client-darwin-amd64-{version}.dylib",
      ]),
    },
    win32: {
      x64: LibraryHandler.asset("windows-amd64.dll", "tls-client-64.dll", [
        LibraryHandler.xgo("windows", "amd64", "dll"),
        "tls-client-windows-64-{version}.dll",
      ]),
      ia32: LibraryHandler.asset("windows-386.dll", "tls-client-32.dll", [
        LibraryHandler.xgo("windows", "386", "dll"),
        "tls-client-windows-32-{version}.dll",
      ]),
    },
    linux: {
      x64: LibraryHandler.asset("linux-amd64.so", "tls-client-x64.so", [
        LibraryHandler.xgo("linux", "amd64", "so"),
        "tls-client-linux-ubuntu-amd64-{version}.so",
      ]),
      arm64: LibraryHandler.asset("linux-arm64.so", "tls-client-arm64.so", [
        LibraryHandler.xgo("linux", "arm64", "so"),
        "tls-client-linux-arm64-{version}.so",
      ]),
      arm: LibraryHandler.asset("linux-arm.so", "tls-client-armv7.so", [
        LibraryHandler.xgo("linux", "arm-7", "so"),
        LibraryHandler.xgo("linux", "arm-6", "so"),
        "tls-client-linux-armv7-{version}.so",
      ]),
      ia32: LibraryHandler.asset("linux-386.so", "tls-client-386.so", [
        LibraryHandler.xgo("linux", "386", "so"),
      ]),
      ppc64: LibraryHandler.asset("linux-ppc64le.so", "tls-client-ppc64le.so", [
        LibraryHandler.xgo("linux", "ppc64le", "so"),
      ]),
      s390x: LibraryHandler.asset("linux-s390x.so", "tls-client-s390x.so", [
        LibraryHandler.xgo("linux", "s390x", "so"),
      ]),
      riscv64: LibraryHandler.asset(
        "linux-riscv64.so",
        "tls-client-riscv64.so",
        [LibraryHandler.xgo("linux", "riscv64", "so")],
      ),
    },
  };

  /** Path chosen by the last `validateFile()` (may be an offline fallback). */
  private static resolvedPath: string | null = null;
  /** Bindings are created once per library path and reused across re-inits. */
  private static loaded: { path: string; fns: TlsNativeLibrary } | null = null;

  /** Library path chosen by the last `validateFile()`, or `null` before it ran. */
  static currentLibraryPath(): string | null {
    return LibraryHandler.resolvedPath;
  }

  static fileInfo(): FileInfo {
    const info = LibraryHandler.ASSETS[process.platform]?.[process.arch];
    if (!info) {
      throw new TlsClientError(
        `tls-client publishes no shared library for ${process.platform}/${process.arch}.`,
      );
    }
    return info;
  }

  /**
   * Cache location for this package version (`os.tmpdir()` by default). The
   * version is part of the name, so an upgrade downloads once and never
   * replaces a file another process may have loaded.
   */
  static libraryPath(cacheDir = os.tmpdir()): string {
    return path.join(
      cacheDir,
      `tls-client-${packageVersion}-${LibraryHandler.fileInfo().name}`,
    );
  }

  /**
   * Ensure a shared library is available: use this version's cached file,
   * else download the newest upstream release, else fall back (with a
   * warning) to any previously cached binary so an offline upgrade keeps
   * working. Throws `TlsClientError` when none of that is possible.
   */
  static async validateFile(
    opts: { request?: HttpRequest; cacheDir?: string } = {},
  ): Promise<void> {
    const cacheDir = opts.cacheDir ?? os.tmpdir();
    const info = LibraryHandler.fileInfo();
    const libPath = LibraryHandler.libraryPath(cacheDir);

    if (await LibraryHandler.exists(libPath)) {
      LibraryHandler.resolvedPath = libPath;
      return;
    }

    try {
      await LibraryDownloader.retrieveLibrary(
        info,
        libPath,
        LibraryHandler.REPO,
        opts.request,
      );
      LibraryHandler.resolvedPath = libPath;
    } catch (e) {
      const fallback = await LibraryHandler.findCached(cacheDir, info);
      if (!fallback) throw e;
      logger.warn(
        `${e instanceof Error ? e.message : e} — using previously cached ${path.basename(fallback)} instead.`,
      );
      LibraryHandler.resolvedPath = fallback;
    }
  }

  static retrieveLibrary(): TlsNativeLibrary {
    const libPath = LibraryHandler.resolvedPath ?? LibraryHandler.libraryPath();
    if (LibraryHandler.loaded?.path === libPath)
      return LibraryHandler.loaded.fns;

    let library: ReturnType<typeof koffi>;
    try {
      library = koffi(libPath);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      let message = `Failed to load the tls-client shared library at ${libPath}: ${reason}`;
      if (process.platform === "linux" && !LibraryHandler.hasGlibc()) {
        message +=
          ". This looks like a musl-based system (e.g. Alpine): upstream ships glibc-linked binaries only, so alpine/musl is not supported — use a glibc-based image such as node:<version>-slim.";
      }
      throw new TlsClientError(message);
    }

    const fns: TlsNativeLibrary = {
      request: LibraryHandler.wrap(
        library.func("request", "string", ["string"]),
      ),
      // Sync on purpose: natively a mutex-guarded map delete + C.free.
      freeMemory: library.func("freeMemory", "void", ["string"]) as (
        id: string,
      ) => void,
      destroyAll: LibraryHandler.wrap(library.func("destroyAll", "string", [])),
      destroySession: LibraryHandler.wrap(
        library.func("destroySession", "string", ["string"]),
      ),
    };
    LibraryHandler.loaded = { path: libPath, fns };
    return fns;
  }

  /** Newest previously cached binary for this platform: older package versions or the ≤ 2.1.0 name. */
  private static async findCached(
    cacheDir: string,
    info: FileInfo,
  ): Promise<string | null> {
    const entries = await fs.readdir(cacheDir).catch(() => [] as string[]);
    const candidates = entries.filter(
      (f) =>
        f === info.legacyName ||
        (f.startsWith("tls-client-") && f.endsWith(`-${info.name}`)),
    );
    let best: { file: string; mtime: number } | null = null;
    for (const file of candidates) {
      const stat = await fs.stat(path.join(cacheDir, file)).catch(() => null);
      if (stat?.isFile() && (!best || stat.mtimeMs > best.mtime)) {
        best = { file, mtime: stat.mtimeMs };
      }
    }
    return best ? path.join(cacheDir, best.file) : null;
  }

  private static exists(file: string): Promise<boolean> {
    return fs
      .access(file)
      .then(() => true)
      .catch(() => false);
  }

  private static asset(
    name: string,
    legacyName: string,
    downloadNames: string[],
  ): FileInfo {
    return { name, legacyName, downloadNames };
  }

  private static xgo(goos: string, goarch: string, ext: string): string {
    return `tls-client-xgo-{version}-${goos}-${goarch}.${ext}`;
  }

  /**
   * Promisify a koffi `.async` function: runs the (blocking cgo) call on a
   * libuv threadpool thread and resolves/rejects the Node-style callback.
   */
  private static wrap(
    f: KoffiFunction,
  ): (...args: string[]) => Promise<string> {
    return (...args) =>
      new Promise((resolve, reject) =>
        f.async(...args, (err: Error | null, result: string) =>
          err ? reject(err) : resolve(result),
        ),
      );
  }

  private static hasGlibc(): boolean {
    try {
      const report = process.report?.getReport() as
        { header?: { glibcVersionRuntime?: string } } | undefined;
      return report?.header?.glibcVersionRuntime !== undefined;
    } catch {
      return true;
    }
  }
}
