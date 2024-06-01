"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroySession = exports.destroyAll = exports.freeMemory = exports.request = void 0;
const koffi_1 = require("koffi");
const path_1 = __importDefault(require("path"));
const fileExt = (() => {
    const platform = process.platform;
    const arch = process.arch;
    const extMap = {
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
const libraryPath = path_1.default.join(__dirname, "../", "../", "dependencies", `tls-client${fileExt}`);
const lib = (0, koffi_1.load)(libraryPath);
exports.request = lib.func("request", "string", ["string"]);
exports.freeMemory = lib.func("freeMemory", "void", ["string"]);
exports.destroyAll = lib.func("destroyAll", "string", []);
exports.destroySession = lib.func("destroySession", "string", ["string"]);
