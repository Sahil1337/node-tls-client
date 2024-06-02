import fs from "fs";
import { load } from "koffi";
import path from "path";

const fileExt: string = (() => {
  const platform = process.platform;
  const arch = process.arch;

  const extMap: { [key: string]: { [key: string]: string } } = {
    darwin: {
      arm64: "-arm64.dylib",
      x64: "-x86.dylib",
    },
    win32: {
      x64: "-64.dll",
      ia32: "-32.dll",
    },
    linux: {
      arm64: "-arm64.so",
      x64: "-x86.so",
      default: "-amd64.so",
    },
  };

  return extMap[platform]?.[arch] || extMap.linux.default;
})();

const scriptDirectory = (() => {
  //@ts-ignore
  if (typeof process.pkg !== "undefined") {
    return path.dirname(process.execPath);
  } else {
    return __dirname;
  }
})();

let libraryPath: string;

//@ts-ignore
if (typeof process.pkg !== "undefined") {
  libraryPath = path.join(
    scriptDirectory,
    "node_modules",
    "node-tls-client",
    "dependencies",
    `tls-client${fileExt}`
  );
} else {
  libraryPath = path.join(
    scriptDirectory,
    "../",
    "../",
    "dependencies",
    `tls-client${fileExt}`
  );
}

const lib = load(libraryPath);

export const request = lib.func("request", "string", ["string"]);
export const freeMemory = lib.func("freeMemory", "void", ["string"]);
export const destroyAll = lib.func("destroyAll", "string", []);
export const destroySession = lib.func("destroySession", "string", ["string"]);

fs.readdirSync(path.join(__dirname, "../", "../", "dependencies")).forEach(
  (file) => {
    if (file !== `tls-client${fileExt}`) {
      fs.unlinkSync(path.join(__dirname, "../", "../", "dependencies", file));
    }
  }
);
