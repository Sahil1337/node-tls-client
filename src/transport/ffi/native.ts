/**
 * Loads and handles functionality related to shared library management.
 */

import path from "path";
import fs from "fs/promises";
import { KoffiFunction } from "koffi";
import { PlatformMap, TlsNativeLibrary } from "../../interface/native";
import os from "os";
import { load as koffi } from "koffi";
import { LibraryDownloader } from "../../utils/download";
import { packageVersion } from "../../utils/version";

// Promisify a koffi `.async` fn: runs the (blocking cgo) call on a libuv
// threadpool thread, resolves/rejects the Node-style callback.
const wrap =
  (f: KoffiFunction) =>
  (...a: any[]): Promise<any> =>
    new Promise((res, rej) =>
      f.async(...a, (e: any, r: any) => (e ? rej(e) : res(r)))
    );

export class LibraryHandler {
  private static path = path.join(os.tmpdir(), this.retrieveFileInfo().name);
  private static markerPath = LibraryHandler.path + ".version";

  static async validateFile(): Promise<void> {
    const fileExists = await fs
      .access(this.path)
      .then(() => true)
      .catch(() => false);

    const marker = await fs
      .readFile(this.markerPath, "utf8")
      .then((v) => v.trim())
      .catch(() => null);

    // Re-download when the binary is missing, or when it was fetched for an
    // older wrapper version (stale cache would lack newer client profiles /
    // reject renamed payload fields).
    if (fileExists && marker === packageVersion) return;

    const isDownloaded = await LibraryDownloader.retrieveLibrary(
      LibraryHandler.retrieveFileInfo(),
      LibraryHandler.path,
    );

    if (!isDownloaded) return process.exit(1);

    await fs.writeFile(this.markerPath, packageVersion).catch(() => {});
  }

  static retrieveLibrary(): TlsNativeLibrary {
    const library = koffi(LibraryHandler.path);

    return {
      request: wrap(library.func("request", "string", ["string"])),
      freeMemory: wrap(library.func("freeMemory", "void", ["string"])),
      destroyAll: wrap(library.func("destroyAll", "string", [])),
      destroySession: wrap(library.func("destroySession", "string", ["string"])),
    };
  }

  private static retrieveFileInfo() {
    const platform = process.platform;
    const arch = process.arch;

    const map: PlatformMap = {
      darwin: {
        arm64: {
          name: "tls-client-arm64.dylib",
          downloadName: "tls-client-darwin-arm64-{version}.dylib",
        },
        x64: {
          name: "tls-client-x86.dylib",
          downloadName: "tls-client-darwin-amd64-{version}.dylib",
        },
      },
      win32: {
        x64: {
          name: "tls-client-64.dll",
          downloadName: "tls-client-windows-64-{version}.dll",
        },
        ia32: {
          name: "tls-client-32.dll",
          downloadName: "tls-client-windows-32-{version}.dll",
        },
      },
      linux: {
        arm64: {
          name: "tls-client-arm64.so",
          downloadName: "tls-client-linux-arm64-{version}.so",
        },
        x64: {
          name: "tls-client-x64.so",
          downloadName: "tls-client-linux-ubuntu-amd64-{version}.so",
        },
        default: {
          name: "tls-client-amd64.so",
          downloadName: "tls-client-linux-ubuntu-amd64-{version}.so",
        },
      },
    };

    return map[platform]?.[arch] || map.linux.default;
  }
}
