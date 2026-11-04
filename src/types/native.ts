import { IncomingHttpHeaders } from "http";

/** Promise-returning bindings of the tls-client shared library. */
export interface TlsNativeLibrary {
  request: (payload: string) => Promise<string>;
  freeMemory: (id: string) => void;
  destroyAll: () => Promise<string>;
  destroySession: (payload: string) => Promise<string>;
  /** Present when the binary has the completion queue (node-tls-client's build). */
  queue?: TlsNativeQueue;
}

/**
 * The completion queue of node-tls-client's tls-client build: a request runs
 * on a goroutine instead of holding a thread, and native calls back when
 * requests have finished, so nothing waits on a thread.
 */
export interface TlsNativeQueue {
  /** Starts a request (same payload as `request`) and returns its ticket at once. */
  requestAsync: (payload: string) => number;
  /**
   * The next finished request, or `null` when none finished within
   * `timeoutMs` (0 only polls). Blocks the calling thread while it waits.
   */
  waitNext: (timeoutMs: number) => TlsCompletion | null;
  /**
   * Calls `handler` on the main thread whenever requests have finished
   * (one call can cover many; collect them with `waitNext(0)`). Replaces
   * the previous handler; `null` stops the calls.
   */
  onReady: (handler: (() => void) | null) => void;
}

/** A finished queued request: its ticket and native's response JSON (freed with `freeMemory`). */
export interface TlsCompletion {
  ticket: number;
  response: string;
}

/** Which tls-client shared library `initTLS()` downloads. */
export type NativeBinary = "upstream" | "node-tls-client";

/**
 * @deprecated since 2.2.0 — the native bindings are now promise-returning
 * functions; use {@link TlsNativeLibrary}. Kept so `import { IClient }` still compiles.
 */
export type IClient = TlsNativeLibrary;

export interface InitTLSOptions {
  /**
   * Which tls-client shared library to download:
   * - `"upstream"` (default): bogdanfinn/tls-client's official release.
   *   Each request holds a libuv threadpool thread while it runs, so
   *   requests in parallel are capped at `UV_THREADPOOL_SIZE`.
   * - `"node-tls-client"`: our build of tls-client
   *   (github.com/Sahil1337/tls-client), made from upstream's newest version
   *   tag, which adds a completion queue: requests hold no thread, so every
   *   request you start runs at once, like node-fetch. Memory grows with
   *   requests in flight (roughly 50 KB each); to limit it, cap requests in
   *   flight in your own code, as you would with node-fetch. This works on
   *   the main thread; in a worker thread each request holds a threadpool
   *   thread, as with `"upstream"`, and a warning says so. Falls back to
   *   `"upstream"`, with a warning, when our release has no binary for this
   *   platform or can't be downloaded.
   *
   * The library is loaded once per process: after `destroyTLS()`, a
   * different `binary` takes effect only when the process restarts.
   */
  binary?: NativeBinary;

  /**
   * Maximum number of native calls in flight at once (admission depth) — NOT
   * parallelism. Only for the `"upstream"` binary; node-tls-client's binary
   * runs every request at once, like node-fetch, and ignores it with a
   * warning. Real parallelism is the libuv threadpool, `UV_THREADPOOL_SIZE`
   * (this library sets it to cores×2 at import time when unset, except for
   * an ES module entry file on Node 20,
   * 22.0–22.17 and 24.0–24.2, where you must set it in the environment; libuv
   * caps it at 1024; set `UV_THREADPOOL_SIZE=4` to keep Node's default).
   * Default: that threadpool size. Values above it only queue, and every
   * in-flight call reserves ~256 KiB in koffi (committed memory on Windows).
   * Clamped to koffi's reported `max_async_calls` (4096 on koffi ≥ 2.15).
   */
  concurrency?: number;

  /**
   * Directory the native shared library is downloaded to and loaded from;
   * relative paths resolve against the current working directory, and the
   * directory is created when missing. Default: `os.tmpdir()`. The file is
   * named after this package's version, so an upgrade downloads once and a
   * directory can be shared by several versions or processes. The library is
   * loaded once per process: after `destroyTLS()`, a different `libraryDir`
   * takes effect only when the process restarts.
   */
  libraryDir?: string;
}

/**
 * Represents a response from the shared library.
 */
export interface TlsResponse {
  /**
   * The unique identifier for the response.
   */
  id: string;

  /**
   * The body of the response.
   */
  body: string;

  /**
   * Cookies set in the response.
   */
  cookies: Record<string, string>;

  /**
   * Headers included in the response. Note: at runtime every value is a
   * `string[]` (native returns `map[string][]string`).
   */
  headers: IncomingHttpHeaders;

  /**
   * The session ID associated with the response.
   */
  sessionId: string;

  /**
   * The HTTP status code of the response.
   */
  status: number;

  /**
   * The target URL of the response.
   */
  target: string;

  /**
   * The protocol used for the response.
   */
  usedProtocol: string;
}
