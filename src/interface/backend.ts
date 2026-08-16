/**
 * Transport backend seam. `initTLS({ mode })` selects an implementation
 * (FFI or server); every backend takes/returns the same JSON strings, so
 * Payload/Response shapes are identical across modes.
 */
export interface Backend {
  request(payload: string): Promise<string>; // JSON in → JSON out
  destroySession(payload: string): Promise<string>; // body: JSON.stringify({sessionId})
  freeMemory(id: string): Promise<void>; // server: no-op
  destroyAll(): Promise<string>;
  destroy(): Promise<void>; // release pool/agent
}

export interface InitTLSOptions {
  /** Transport backend. Default `"ffi"`. */
  mode?: "ffi" | "server";
  /**
   * FFI → semaphore permits (in-flight admission / burst-queue depth, NOT
   * parallelism — real parallelism = `UV_THREADPOOL_SIZE`, fixed at process
   * start; clamped to koffi's 4096 max). For concurrency beyond cores*2 raise
   * `UV_THREADPOOL_SIZE`; for true high concurrency use server mode.
   * Server → http Agent `maxSockets` (default 256).
   */
  concurrency?: number;
  server?: {
    /** External server. Required when `mode === "server"` and `managed` is not set. */
    url?: string;
    /** Sent as `X-API-KEY`. Auto-generated when `managed` is set and omitted. */
    apiKey?: string;
    /**
     * Downloads + spawns one local `tls-client-api` process instead of
     * connecting to `url`. Lives for this `Client`'s lifetime — killed by
     * `destroyTLS()`, on host exit, and on SIGINT/SIGTERM. Each spawn gets its
     * own free api/health/metadata ports, so multiple managed instances can
     * coexist on one host.
     *
     * Caveat: the spawned metadata server's bind address isn't independently
     * verified. Random-port allocation avoids port *collision* between
     * instances, but if the underlying gosoline binds `0.0.0.0` the metadata
     * server (which exposes the generated config, including `api_auth_keys`,
     * via its `/config` endpoint) may be reachable from outside the host. No
     * config key was found to control the bind address — a known risk when
     * deploying on a shared or exposed host.
     */
    managed?: boolean;
    /** Port for the spawned server. Default: an OS-assigned free port. */
    port?: number;
    /** Path to an existing `tls-client-api` binary — skips the download. */
    binaryPath?: string;
    /**
     * Show the spawned process's own console output by inheriting stdout/stderr
     * directly into this process's terminal, instead of only piping stderr
     * through this library's logger. Default `false`.
     */
    showOutput?: boolean;
  };
}
