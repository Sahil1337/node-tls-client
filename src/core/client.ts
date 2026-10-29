import { Backend, InitTLSOptions } from "../interface/backend";
import { Payload } from "../interface/payload";
import { TlsClientError, logger } from "../utils";

export class Client {
  private static instance: Client | null = null;
  private static ready = false;
  private static readyPromise: Promise<void> | null = null;
  private static warnedReinit = false;

  private constructor(private readonly _backend: Backend) {}

  public static async init(options: InitTLSOptions = {}): Promise<void> {
    if (Client.ready) {
      // Options are only read on the FIRST successful init() — warn once so a
      // changed `concurrency` doesn't silently do nothing.
      if (!Client.warnedReinit) {
        Client.warnedReinit = true;
        logger.warn(
          "initTLS() called again while already initialized — new options are ignored; call destroyTLS() first to re-init with different options.",
        );
      }
      return;
    }

    Client.readyPromise ??= (async () => {
      // Dynamic import: defers loading koffi's native addon until initTLS(),
      // so merely importing this package never touches native code.
      const [{ LibraryHandler }, { FfiBackend }] = await Promise.all([
        import("../transport/ffi/native"),
        import("../transport/ffi/ffi-backend"),
      ]);
      await LibraryHandler.validateFile();
      Client.instance = new Client(
        new FfiBackend({ concurrency: options.concurrency }),
      );
      Client.ready = true;
    })();

    try {
      await Client.readyPromise;
    } finally {
      // Reset on BOTH success and failure so a failed download can be retried.
      Client.readyPromise = null;
    }
  }

  public static async destroy(): Promise<void> {
    if (!Client.instance) {
      throw new TlsClientError("Client not initialized. Call initTLS() first.");
    }
    // Waits for in-flight requests (each bounded by its own timeout; native
    // defaults to 30 s when none is set). Returning early would let the old
    // backend's deferred destroyAll() wipe the sessions of a later initTLS().
    try {
      await Client.instance._backend.destroy();
    } finally {
      Client.instance = null;
      Client.ready = false;
    }
  }

  public static getInstance(): Client {
    if (!Client.instance) {
      throw new TlsClientError("Client not initialized. Call initTLS() first.");
    }
    return Client.instance;
  }

  public static isReady(): boolean {
    return Client.ready;
  }

  public request(payload: Payload): Promise<string> {
    return this._backend.request(payload);
  }

  public destroySession(sessionId: string): Promise<string> {
    return this._backend.destroySession(sessionId);
  }

  public freeMemory(id: string): void {
    this._backend.freeMemory(id);
  }
}
