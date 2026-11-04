import { TlsNativeLibrary, TlsResponse } from "../../types/native";
import { Payload } from "../../types/payload";
import { Semaphore } from "./semaphore";

/**
 * One loaded tls-client library: sends requests and frees sessions through
 * it, caps in-flight native calls, and frees native's copy of every reply as
 * soon as it has been read. Which client is live, and the
 * initTLS()/destroyTLS() lifecycle, is ../runtime's job.
 *
 * How a request reaches native depends on what the loaded binary exports, so
 * each mode is a subclass that implements `send()`: ThreadpoolClient
 * (upstream's binary: every call is a koffi `.async` call holding a libuv
 * thread) and QueueClient (node-tls-client's binary: requests run on
 * goroutines and native calls back as they finish).
 */
export abstract class NativeClient {
  /** Admits native calls: the in-flight cap, and what close() drains. */
  private readonly gate: Semaphore;

  /** `permits`: native calls in flight at once (`Infinity` for no cap). */
  protected constructor(
    protected readonly lib: TlsNativeLibrary,
    permits: number,
  ) {
    this.gate = new Semaphore(permits);
  }

  /** Sends one request; resolves with native's parsed response. */
  async request(payload: Payload): Promise<TlsResponse> {
    const json = JSON.stringify(payload);
    const raw = await this.gated(() => this.send(json));
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

  /** Stops admitting calls, waits for in-flight ones, releases native state. */
  async close(): Promise<void> {
    // Reject new calls, let admitted ones finish (Piscina close() parity)…
    await this.gate.close();
    // …then clear native session state. Ungated on purpose: the gate is
    // closed and nothing else is running. The koffi library itself stays
    // loaded process-wide; there is nothing to unload.
    this.free(NativeClient.replyId(await this.lib.destroyAll()));
  }

  /** Hands one admitted request's JSON to native; resolves with its response JSON. */
  protected abstract send(json: string): Promise<string>;

  /**
   * Extract the `id` native registered a reply's C string under. Returns ""
   * when the reply is not parseable or carries no id.
   */
  protected static replyId(raw: string): string {
    try {
      const id = JSON.parse(raw)?.id;
      return typeof id === "string" ? id : "";
    } catch {
      return "";
    }
  }

  protected free(id: string): void {
    if (id) this.lib.freeMemory(id);
  }

  private async gated<T>(fn: () => Promise<T>): Promise<T> {
    await this.gate.acquire();
    try {
      return await fn();
    } finally {
      this.gate.release();
    }
  }
}
