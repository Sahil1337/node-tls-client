"use strict";
/**
 * Loads and handles functionality related to shared library management.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryHandler = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const koffi_1 = require("koffi");
const download_1 = require("./download");
class LibraryHandler {
    static path = path_1.default.join(os_1.default.tmpdir(), this.retrieveFileInfo().name);
    static async validateFile() {
        const fileExists = await promises_1.default
            .access(this.path)
            .then(() => true)
            .catch(() => false);
        if (!fileExists) {
            const isDownloaded = await download_1.LibraryDownloader.retrieveLibrary(LibraryHandler.retrieveFileInfo(), LibraryHandler.path);
            if (!isDownloaded)
                return process.exit(1);
        }
    }
    static retrieveLibrary() {
        const library = (0, koffi_1.load)(LibraryHandler.path);
        return {
            request: library.func("request", "string", ["string"]),
            freeMemory: library.func("freeMemory", "void", ["string"]),
            destroyAll: library.func("destroyAll", "string", []),
            destroySession: library.func("destroySession", "string", ["string"]),
        };
    }
    static retrieveFileInfo() {
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
}
exports.LibraryHandler = LibraryHandler;
