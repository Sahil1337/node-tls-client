"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const koffi_1 = require("koffi");
/**
 * Loads the native library from the lib directory.
 * @returns {Promise<IClient>}
 */
async function load() {
    const file = fileInfo();
    // Since we're using TypeScript and paths are relative to the compiled output,
    // this will reliably get the path to the lib directory from the dist/utils directory
    const packageRoot = path_1.default.resolve(process.cwd());
    const libraryPath = path_1.default.join(packageRoot, "lib", file.name);
    if (!fs_1.default.existsSync(libraryPath)) {
        throw new Error(`Native library not found: ${file.name}. Please ensure it exists in the lib directory.`);
    }
    const lib = (0, koffi_1.load)(libraryPath);
    return {
        request: lib.func("request", "string", ["string"]),
        freeMemory: lib.func("freeMemory", "void", ["string"]),
        destroyAll: lib.func("destroyAll", "string", []),
        destroySession: lib.func("destroySession", "string", ["string"]),
    };
}
exports.load = load;
function fileInfo() {
    const platform = process.platform;
    const arch = process.arch;
    const map = {
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
