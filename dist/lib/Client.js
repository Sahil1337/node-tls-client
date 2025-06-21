"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const piscina_1 = require("piscina");
const native_1 = require("../utils/native");
const utils_1 = require("../utils");
const os_1 = __importDefault(require("os"));
class Client {
    static instance = null;
    static ready = false;
    static readyPromise = null;
    _pool;
    constructor() {
        this._pool = new piscina_1.Piscina({
            filename: require.resolve("../workers/index.js"),
            maxQueue: Infinity,
            maxThreads: (typeof os_1.default.availableParallelism === "function"
                ? os_1.default.availableParallelism()
                : os_1.default.cpus().length) * 2,
            atomics: "disabled",
        });
    }
    static async init() {
        if (Client.ready)
            return;
        if (!Client.readyPromise) {
            // Initialize ready promise
            Client.readyPromise = (async () => {
                await native_1.LibraryHandler.validateFile();
                Client.instance = new Client();
                Client.ready = true;
                Client.readyPromise = null;
            })();
        }
        return Client.readyPromise;
    }
    static async destroy() {
        if (!Client.instance) {
            throw new utils_1.TlsClientError("Client not initialized. Call initTLS() first.");
        }
        // Clear sessions cache
        await Client.instance.pool.run({}, { name: "destroyAll" });
        // Destroy worker pool
        await Client.instance.pool.close();
        // Reset instance
        Client.instance = null;
        Client.ready = false;
    }
    static getInstance() {
        if (!Client.instance) {
            throw new utils_1.TlsClientError("Client not initialized. Call initTLS() first.");
        }
        return Client.instance;
    }
    get pool() {
        return this._pool;
    }
    static isReady() {
        return Client.ready;
    }
}
exports.Client = Client;
