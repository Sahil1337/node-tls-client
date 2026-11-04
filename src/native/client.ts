import { InitTLSOptions, TlsNativeLibrary, TlsResponse } from "../types/native";
import { Payload } from "../types/payload";
import { TlsClientError, logger, threadpoolSize } from "../utils";
import { Semaphore } from "./semaphore";

/**
 * Process-wide gateway to the tls-client shared library. Owns the
 * initTLS()/destroyTLS() lifecycle, caps in-flight native calls, and frees
 * native's copy of every reply as soon as it has been read.
 *
 * Tests stub the library by assigning `NativeClient.instance` from JS.
 */
export class NativeClient {
  private static instance: NativeClient | null = null;
  private static pending: Promise<void> | null = null;
  private static destroying: Promise<void> | null = null;

  private readonly gate: Semaphore;

  private constructor(
    private readonly lib: TlsNativeLibrary,
    permits: number,
  ) {
    this.gate = new Semaphore(permits);
  }

  static async init(options: InitTLSOptions = {}): Promise<void> {
    // A destroy in progress nulls `instance` when it finishes, so wait for it
    // and create a fresh client with these options. Its failure is its
    // caller's to handle; the instance is cleared either way.
    await NativeClient.destroying?.catch(() => {});
    if (NativeClient.instance) {
      // Options are only read on the FIRST successful init() — warn once so a
      // changed `concurrency` doesn't silently do nothing.
      logger.warnOnce(
        "reinit",
        "initTLS() called again while already initialized — new options are ignored; call destroyTLS() first to re-init with different options.",
      );
      return;
    }
    // Concurrent callers share one attempt. Reset on BOTH success and failure
    // so a failed download can be retried.
    NativeClient.pending ??= NativeClient.create(options).finally(() => {
      NativeClient.pending = null;
    });
    await NativeClient.pending;
  }

  static async destroy(): Promise<void> {
    // Concurrent callers share one close(); a second would run destroyAll()
    // again. Waits for in-flight requests (each bounded by its own timeout;
    // native defaults to 30 s when none is set). Returning early would let
    // this client's deferred destroyAll() wipe the sessions of a later
    // initTLS().
    NativeClient.destroying ??= NativeClient.get()
      .close()
      .finally(() => {
        NativeClient.instance = null;
        NativeClient.destroying = null;
      });
    await NativeClient.destroying;
  }

  static get(): NativeClient {
    if (!NativeClient.instance) {
      throw new TlsClientError("Client not initialized. Call initTLS() first.");
    }
    return NativeClient.instance;
  }

  /** Sends one request; resolves with native's parsed response. */
  async request(payload: Payload): Promise<TlsResponse> {
    const raw = await this.gated(() =>
      this.lib.request(JSON.stringify(payload)),
    );
    const response: TlsResponse = JSON.parse(raw);
    this.free(response.id);
    return response;
  }

  /** Frees one native session; resolves with native's `{ id, success }` JSON. */
  async destroySession(sessionId: string): Promise<string> {
    const raw = await this.gated(() =>
      this.lib.destroySession(JSON.stringify({ sessionId })),
    );
    this.free(NativeClient.replyId(raw));
    return raw;
  }

  private static async create(options: InitTLSOptions): Promise<void> {
    // Dynamic import: defers loading koffi's native addon until initTLS(),
    // so merely importing this package never touches native code.
    const { locateLibrary, loadLibrary } = await import("./library");
    const libPath = await locateLibrary({ dir: options.libraryDir });

    const pool = threadpoolSize();
    const requested = NativeClient.requestedConcurrency(options, pool);
    const { bindings, maxAsyncCalls } = loadLibrary(libPath, requested ?? pool);
    if (requested !== undefined && requested > pool) {
      logger.warnOnce(
        "over-provision",
        `FFI concurrency ${requested} exceeds the libuv threadpool size (${pool}); the excess only queues and adds no parallelism. Set UV_THREADPOOL_SIZE before starting Node to run more requests at once.`,
      );
    }
    // Floor of 1: a host may have configured max_async_calls to 0.
    const permits = Math.max(1, Math.min(requested ?? pool, maxAsyncCalls));
    NativeClient.instance = new NativeClient(bindings, permits);
  }

  /**
   * `concurrency`, or `undefined` when unset or invalid: 0 or NaN would give
   * the semaphore 0 permits and every request would wait forever.
   */
  private static requestedConcurrency(
    { concurrency }: InitTLSOptions,
    pool: number,
  ): number | undefined {
    if (concurrency === undefined) return undefined;
    if (Number.isFinite(concurrency) && concurrency > 0) return concurrency;
    logger.warnOnce(
      "invalid-concurrency",
      `FFI concurrency must be a positive finite number, got ${concurrency}; using the threadpool size (${pool}).`,
    );
    return undefined;
  }

  /**
   * Extract the `id` native registered a reply's C string under. Returns ""
   * when the reply is not parseable or carries no id.
   */
  private static replyId(raw: string): string {
    try {
      const id = JSON.parse(raw)?.id;
      return typeof id === "string" ? id : "";
    } catch {
      return "";
    }
  }

  private async gated<T>(fn: () => Promise<T>): Promise<T> {
    await this.gate.acquire();
    try {
      return await fn();
    } finally {
      this.gate.release();
    }
  }

  private free(id: string): void {
    if (id) this.lib.freeMemory(id);
  }

  /** Stops admitting calls, waits for in-flight ones, releases native state. */
  private async close(): Promise<void> {
    // Reject new calls, let admitted ones finish (Piscina close() parity)…
    await this.gate.close();
    // …then clear native session state. Ungated on purpose: the gate is
    // closed and nothing else is running. The koffi library itself stays
    // loaded process-wide; there is nothing to unload.
    this.free(NativeClient.replyId(await this.lib.destroyAll()));
  }
}
