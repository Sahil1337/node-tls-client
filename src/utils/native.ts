/**
 * Loads and handles functionality related to shared library management.
 */

import path from "path";
import fs from "fs/promises";
import { PlatformMap, TlsNativeLibrary } from "../interface/native";
import os from "os";
import { load as koffi } from "koffi";
import { LibraryDownloader } from "./download";

export class LibraryHandler {
  private static path = path.join(os.tmpdir(), this.retrieveFileInfo().name);

  static async validateFile(): Promise<void> {
    const fileExists = await fs
      .access(this.path)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      const isDownloaded = await LibraryDownloader.retrieveLibrary(
        LibraryHandler.retrieveFileInfo(),
        LibraryHandler.path
      );

      if (!isDownloaded) return process.exit(1);
    }
  }

  static retrieveLibrary(): TlsNativeLibrary {
    const library = koffi(LibraryHandler.path);

    return {
      request: library.func("request", "string", ["string"]),
      freeMemory: library.func("freeMemory", "void", ["string"]),
      destroyAll: library.func("destroyAll", "string", []),
      destroySession: library.func("destroySession", "string", ["string"]),
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
