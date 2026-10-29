import { Payload } from "./payload";

/**
 * Internal transport seam. Not part of the public API: nothing can inject a
 * backend from outside, tests stub it by assigning `Client.instance` from JS.
 * A future HTTP backend implements the same contract.
 */
export interface Backend {
  /** Serializes the payload itself; resolves with native's JSON response. */
  request(payload: Payload): Promise<string>;
  /** Resolves with native's `{ id, success }` JSON; the caller frees `id`. */
  destroySession(sessionId: string): Promise<string>;
  /** Synchronous on purpose: natively a mutex-guarded map delete + C.free. */
  freeMemory(id: string): void;
  /** Stops admitting calls, waits for in-flight ones, releases native state. */
  destroy(): Promise<void>;
}

export interface InitTLSOptions {
  /**
   * Maximum number of native calls in flight at once (admission depth) — NOT
   * parallelism. Real parallelism is the libuv threadpool, `UV_THREADPOOL_SIZE`
   * (this library sets it to cores×2 at import time when unset; libuv caps it
   * at 1024; set `UV_THREADPOOL_SIZE=4` to keep Node's default). Default: that
   * threadpool size. Values above it only queue, and every in-flight call
   * reserves ~256 KiB in koffi (committed memory on Windows). Clamped to koffi's
   * reported `max_async_calls` (4096 on koffi ≥ 2.15).
   */
  concurrency?: number;
}
