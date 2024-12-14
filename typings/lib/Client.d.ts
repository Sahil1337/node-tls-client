import { TlsResponse } from "../interface";
export declare class Client {
    private client;
    constructor();
    /**
     * Intialize the client and load the native library.
     */
    init(): Promise<void>;
    /**
     * Performs an HTTP request with native library.
     * @param {string} payload - The request payload to be sent.
     * @returns {Promise<TlsResponse>} - A promise resolving to the parsed TLS response object.
     * @throws {TlsClientError} - If no response is received from the client.
     */
    request(payload: string): Promise<TlsResponse>;
    /**
     * Destroys all sessions and removes session cache from memory.
     * @param {string} payload
     * @returns {Promise<string>} - A promise resolving to the session id.
     */
    destroySession(payload: string): Promise<string>;
    /**
     * Removes cache from memory.
     * @returns {Promise<void>}
     */
    freeMemory(id: string): Promise<void>;
}
