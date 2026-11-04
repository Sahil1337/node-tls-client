import { IncomingHttpHeaders } from "http";

/** Promise-returning bindings of the tls-client shared library. */
export interface TlsNativeLibrary {
  request: (payload: string) => Promise<string>;
  freeMemory: (id: string) => void;
  destroyAll: () => Promise<string>;
  destroySession: (payload: string) => Promise<string>;
}

/**
 * @deprecated since 2.2.0 — the native bindings are now promise-returning
 * functions; use {@link TlsNativeLibrary}. Kept so `import { IClient }` still compiles.
 */
export type IClient = TlsNativeLibrary;

export interface InitTLSOptions {
  /**
   * Maximum number of native calls in flight at once (admission depth) — NOT
   * parallelism. Real parallelism is the libuv threadpool, `UV_THREADPOOL_SIZE`
   * (this library sets it to cores×2 at import time when unset, except for an
   * ES module entry file on Node 20, 22.0–22.17 and 24.0–24.2, where you must
   * set it in the environment; libuv caps it at 1024; set
   * `UV_THREADPOOL_SIZE=4` to keep Node's default). Default: that
   * threadpool size. Values above it only queue, and every in-flight call
   * reserves ~256 KiB in koffi (committed memory on Windows). Clamped to koffi's
   * reported `max_async_calls` (4096 on koffi ≥ 2.15).
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
