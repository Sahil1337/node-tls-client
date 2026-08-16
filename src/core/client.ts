import { Backend, InitTLSOptions } from "../interface";
import { TlsClientError, logger } from "../utils";
// Imported directly from their own files, NOT the `../transport` barrel — the
// barrel re-exports FfiBackend too, and merely importing anything through it
// would eagerly load ffi-backend.ts (and koffi's native addon with it) even
// in server mode. FfiBackend itself is loaded dynamically below, only when
// mode is actually "ffi".
import { ServerBackend } from "../transport/server/server-backend";
import { ManagedServerBackend } from "../transport/server/managed";

let warnedManagedUrlIgnored = false;
let warnedReinit = false;
const DESTROY_ALL_TIMEOUT_MS = 5_000;

export class Client {
  private static instance: Client | null = null;
  private static ready = false;
  private static readyPromise: Promise<void> | null = null;

  private constructor(private readonly _backend: Backend) {}

  public static async init(options: InitTLSOptions = {}): Promise<void> {
    if (Client.ready) {
      // Options are only read on the FIRST successful init() — a second call
      // (even with a different mode/server/concurrency) is a silent no-op
      // against the already-active backend. Warn once so switching modes
      // without an intervening destroyTLS() doesn't fail silently.
      if (!warnedReinit) {
        warnedReinit = true;
        logger.warn(
          "initTLS() called again while already initialized — new options are ignored; call destroyTLS() first to re-init with different options.",
        );
      }
      return;
    }
    const mode = options.mode ?? "ffi";

    Client.readyPromise ??= (async () => {
      if (mode === "server") {
        if (options.server?.managed) {
          if (options.server.url && !warnedManagedUrlIgnored) {
            warnedManagedUrlIgnored = true;
            logger.warn(
              "mode:'server' — server.url is ignored when server.managed is true.",
            );
          }
          Client.instance = new Client(
            await ManagedServerBackend.create({
              port: options.server.port,
              binaryPath: options.server.binaryPath,
              apiKey: options.server.apiKey,
              showOutput: options.server.showOutput,
              concurrency: options.concurrency,
            }),
          );
        } else if (!options.server?.url) {
          throw new TlsClientError("mode:'server' requires server.url");
        } else {
          Client.instance = new Client(
            new ServerBackend({
              url: options.server.url,
              apiKey: options.server.apiKey,
              concurrency: options.concurrency,
            }),
          );
        }
      } else {
        // Dynamic import: koffi's native addon can fail to load on a
        // platform/arch it doesn't ship a prebuilt for — must not be pulled
        // in for server-mode-only users who never touch FFI at all.
        const [{ LibraryHandler }, { FfiBackend }] = await Promise.all([
          import("../transport/ffi/native"),
          import("../transport/ffi/ffi-backend"),
        ]);
        await LibraryHandler.validateFile();
        Client.instance = new Client(
          new FfiBackend({ concurrency: options.concurrency }),
        );
      }
      Client.ready = true;
    })();

    try {
      await Client.readyPromise;
    } finally {
      // Reset on BOTH success and failure so a bad config (missing url, etc.)
      // can be retried. On success `ready` short-circuits re-entry anyway.
      Client.readyPromise = null;
    }
  }

  public static async destroy(): Promise<void> {
    if (!Client.instance) {
      throw new TlsClientError("Client not initialized. Call initTLS() first.");
    }
    // Best-effort, bounded: a hung/unreachable backend (e.g. a managed child
    // that's about to be killed anyway) must not block teardown for up to the
    // backend's own request timeout.
    await Promise.race([
      Client.instance._backend.destroyAll().catch(() => {}),
      new Promise<void>((resolve) => setTimeout(resolve, DESTROY_ALL_TIMEOUT_MS)),
    ]);
    await Client.instance._backend.destroy();
    Client.instance = null;
    Client.ready = false;
  }

  public static getInstance(): Client {
    if (!Client.instance) {
      throw new TlsClientError("Client not initialized. Call initTLS() first.");
    }
    return Client.instance;
  }

  public request(payload: string): Promise<string> {
    return this._backend.request(payload);
  }

  public destroySession(payload: string): Promise<string> {
    return this._backend.destroySession(payload);
  }

  public freeMemory(id: string): Promise<void> {
    return this._backend.freeMemory(id);
  }

  public destroyAll(): Promise<string> {
    return this._backend.destroyAll();
  }

  public static isReady(): boolean {
    return Client.ready;
  }
}
