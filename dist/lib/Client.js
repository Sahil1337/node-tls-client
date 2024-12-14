"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const utils_1 = require("../utils");
const tlsError_1 = require("../utils/tlsError");
class Client {
    client;
    constructor() {
        this.client = {};
    }
    /**
     * Intialize the client and load the native library.
     */
    async init() {
        this.client = await (0, utils_1.load)();
    }
    /**
     * Performs an HTTP request with native library.
     * @param {string} payload - The request payload to be sent.
     * @returns {Promise<TlsResponse>} - A promise resolving to the parsed TLS response object.
     * @throws {TlsClientError} - If no response is received from the client.
     */
    async request(payload) {
        const response = this.client.request(payload);
        if (!response)
            throw new tlsError_1.TlsClientError("No response received.");
        return JSON.parse(response);
    }
    /**
     * Destroys all sessions and removes session cache from memory.
     * @param {string} payload
     * @returns {Promise<string>} - A promise resolving to the session id.
     */
    async destroySession(payload) {
        return this.client.destroySession(payload);
    }
    /**
     * Removes cache from memory.
     * @returns {Promise<void>}
     */
    async freeMemory(id) {
        if (!id)
            return;
        this.client.freeMemory(id);
    }
}
exports.Client = Client;
