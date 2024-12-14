import { load } from "../utils";
import { IClient, TlsResponse } from "../interface";
import { TlsClientError } from "../utils/tlsError";

export class Client {
  private client: IClient;

  constructor() {
    this.client = {} as IClient;
  }

  /**
   * Intialize the client and load the native library.
   */
  async init(): Promise<void> {
    this.client = await load();
  }

  /**
   * Performs an HTTP request with native library.
   * @param {string} payload - The request payload to be sent.
   * @returns {Promise<TlsResponse>} - A promise resolving to the parsed TLS response object.
   * @throws {TlsClientError} - If no response is received from the client.
   */
  async request(payload: string): Promise<TlsResponse> {
    const response = this.client.request(payload);
    if (!response) throw new TlsClientError("No response received.");
    return JSON.parse(response);
  }

  /**
   * Destroys all sessions and removes session cache from memory.
   * @param {string} payload
   * @returns {Promise<string>} - A promise resolving to the session id.
   */
  async destroySession(payload: string): Promise<string> {
    return this.client.destroySession(payload);
  }

  /**
   * Removes cache from memory.
   * @returns {Promise<void>}
   */
  async freeMemory(id: string): Promise<void> {
    if (!id) return;
    this.client.freeMemory(id);
  }
}
