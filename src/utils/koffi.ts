import path from "path";
import fs from "fs";
import os from "os";
import { load as koffi } from "koffi";
import { Download } from "./download";
import { IClient } from "../interface/client";

/**
 * Downloads and loads the native library.
 * @returns {Promise<IClient>}
 */
export async function load(): Promise<IClient> {
  const file = fileInfo();
  const temp = os.tmpdir();
  const libraryPath = path.join(temp, file.name);

  if (!fs.existsSync(libraryPath)) {
    const downloader = new Download(file, libraryPath);
    await downloader.init();
  }

  const lib = koffi(libraryPath);

  return {
    request: lib.func("request", "string", ["string"]),
    freeMemory: lib.func("freeMemory", "void", ["string"]),
    destroyAll: lib.func("destroyAll", "string", []),
    destroySession: lib.func("destroySession", "string", ["string"]),
  };
}

function fileInfo() {
  const platform = process.platform;
  const arch = process.arch;

  const map: Record<string, any> = {
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
