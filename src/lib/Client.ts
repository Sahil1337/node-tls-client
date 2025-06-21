import { Piscina } from "piscina";
import { LibraryHandler } from "../utils/native";
import { TlsClientError } from "../utils";
import os from "os";

export class Client {
  private static instance: Client | null = null;
  private static ready = false;
  private static readyPromise: Promise<void> | null = null;

  private _pool: Piscina;

  private constructor() {
    this._pool = new Piscina({
      filename: require.resolve("../workers/index.js"),
      maxQueue: Infinity,
      maxThreads:
        (typeof os.availableParallelism === "function"
          ? os.availableParallelism()
          : os.cpus().length) * 2,
      atomics: "disabled",
    });
  }

  public static async init(): Promise<void> {
    if (Client.ready) return;

    if (!Client.readyPromise) {
      // Initialize ready promise
      Client.readyPromise = (async () => {
        await LibraryHandler.validateFile();
        Client.instance = new Client();
        Client.ready = true;
        Client.readyPromise = null;
      })();
    }

    return Client.readyPromise;
  }

  public static async destroy(): Promise<void> {
    if (!Client.instance) {
      throw new TlsClientError("Client not initialized. Call initTLS() first.");
    }
    // Clear sessions cache
    await Client.instance.pool.run({}, { name: "destroyAll" });
    // Destroy worker pool
    await Client.instance.pool.close();
    // Reset instance
    Client.instance = null;
    Client.ready = false;
  }

  public static getInstance(): Client {
    if (!Client.instance) {
      throw new TlsClientError("Client not initialized. Call initTLS() first.");
    }
    return Client.instance;
  }

  public get pool(): Piscina {
    return this._pool;
  }

  public static isReady(): boolean {
    return Client.ready;
  }
}
