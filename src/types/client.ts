/** What a native client sizes its gates from (built by `create` in native/runtime.ts). */
export interface ClientLimits {
  /** `initTLS({ concurrency })`, or `undefined` when unset or invalid. */
  requested: number | undefined;
  /** The libuv threadpool size. */
  pool: number;
  /** koffi's `max_async_calls` in effect. */
  maxAsyncCalls: number;
}
