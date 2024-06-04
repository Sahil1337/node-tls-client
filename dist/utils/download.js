"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Download = void 0;
const os_1 = __importDefault(require("os"));
const logger_1 = require("./logger");
const https_1 = __importDefault(require("https"));
const fs_1 = __importStar(require("fs"));
class Download {
    temp = os_1.default.tmpdir();
    file;
    path;
    issueURL = "https://github.com/Sahil1337/node-tls-client/issues";
    constructor(file, libPath) {
        this.file = file;
        this.path = libPath;
    }
    async init() {
        try {
            const latest = await this.getLatest();
            if (latest) {
                await this.extract(latest.browser_download_url);
                logger_1.logger.success("Extracted shared library.");
            }
            else {
                logger_1.logger.error(`Failed to find required asset: ${this.file.name}, report ${logger_1.logger.hyperlink("here", this.issueURL)}.`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Initialization failed: ${error}`);
        }
    }
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0)
            return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }
    progress(downloaded, total) {
        const percentage = (downloaded / total) * 100;
        const progress = Math.floor(percentage / 2);
        const bar = "█".repeat(progress) + " ".repeat(50 - progress);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${logger_1.logger.stamp} DOWNLOADING:[${bar}] ${percentage.toFixed(2)}% (${this.formatBytes(downloaded)} / ${this.formatBytes(total)})`);
    }
    async download(url, file) {
        return new Promise((resolve, reject) => {
            https_1.default
                .get(url, (response) => {
                if (response.statusCode &&
                    response.statusCode >= 300 &&
                    response.statusCode < 400 &&
                    response.headers.location) {
                    const newURL = new URL(response.headers.location, url).toString();
                    logger_1.logger.debug(`Fetched shared library ${logger_1.logger.hyperlink("url", newURL)}`);
                    this.download(newURL, file).then(resolve).catch(reject);
                }
                else if (response.statusCode &&
                    response.statusCode >= 200 &&
                    response.statusCode < 300) {
                    const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
                    let downloadedBytes = 0;
                    response.pipe(file);
                    response.on("data", (chunk) => {
                        downloadedBytes += chunk.length;
                        this.progress(downloadedBytes, totalBytes);
                    });
                    response.on("end", () => {
                        file.close((err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                process.stdout.write("\n"); // Ensure a new line after the progress bar
                                resolve();
                            }
                        });
                    });
                    file.on("error", (err) => {
                        fs_1.default.unlink(this.path, () => reject(err));
                    });
                }
                else {
                    logger_1.logger.error(`Failed to download the file [statusCode:${response.statusCode}]`);
                    reject();
                }
            })
                .on("error", (err) => {
                fs_1.default.unlink(this.path, () => reject(err));
            });
        });
    }
    async extract(url) {
        return new Promise((resolve, reject) => {
            const file = (0, fs_1.createWriteStream)(this.path);
            this.download(url, file).then(resolve).catch(reject);
        });
    }
    async getLatest() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: "api.github.com",
                path: "/repos/bogdanfinn/tls-client/releases/latest",
                method: "GET",
                headers: {
                    "user-agent": "node-tls-client",
                },
            };
            https_1.default
                .get(options, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    if (res.statusCode === 200) {
                        try {
                            const response = JSON.parse(data);
                            const version = response.tag_name.replace("v", "");
                            logger_1.logger.debug(`Fetched latest version: v${version}`);
                            const assetName = this.file.downloadName.replace("{version}", version);
                            const asset = response.assets.find((asset) => asset.name === assetName);
                            if (!asset) {
                                logger_1.logger.error(`Failed to find required asset: ${this.file.name}, report ${logger_1.logger.hyperlink("here", this.issueURL)}.`);
                                resolve(null);
                            }
                            else {
                                resolve(asset);
                            }
                        }
                        catch (err) {
                            logger_1.logger.error(`Failed to parse response: ${err}`);
                            resolve(null);
                        }
                    }
                    else {
                        logger_1.logger.error(`Failed to fetch the latest version. Status code: ${res.statusCode}`);
                        resolve(null);
                    }
                });
            })
                .on("error", (err) => {
                logger_1.logger.error(`Failed to fetch the latest version: ${err}`);
                resolve(null);
            });
        });
    }
}
exports.Download = Download;
