import { config as koffiConfig } from "koffi";
import { Backend, InitTLSOptions } from "../../interface/backend";
import { TlsNativeLibrary } from "../../interface/native";
import { Payload } from "../../interface/payload";
import { cpuCount, logger, parseNativeId } from "../../utils";
import { LibraryHandler } from "./native";
import { Semaphore } from "./semaphore";

export class FfiBackend implements Backend {
  /**
   * koffi's hard `max_async_calls` ceiling (ffi.hh:20). koffi's running+queued
   * limit is raised to it so the semaphore, not koffi, is the throttle.
   */
  private static readonly KOFFI_MAX_ASYNC_CALLS = 4096;
  /** libuv silently caps UV_THREADPOOL_SIZE here (threadpool.c MAX_THREADPOOL_SIZE). */
  private static readonly LIBUV_MAX_THREADPOOL = 1024;
  /** koffi keeps at most this many async memory pools resident (misc.md "Default settings"). */
  private static readonly KOFFI_MAX_RESIDENT_POOLS = 16;
  // One-time warnings across the process (survive destroyTLS + re-init).
  private static warnedConfig = false;
  private static warnedOverProvision = false;
  private static warnedInvalidConcurrency = false;

  private readonly fns: TlsNativeLibrary;
  private readonly sem: Semaphore;

  constructor(options: InitTLSOptions = {}) {
    const pool = FfiBackend.threadpoolSize();
    // concurrency:0 or NaN would give the semaphore 0 permits — every request
    // would await acquire() forever. Treat non-positive/non-finite as "unset".
    const requested =
      options.concurrency !== undefined &&
      Number.isFinite(options.concurrency) &&
      options.concurrency > 0
        ? options.concurrency
        : undefined;
    if (
      !FfiBackend.warnedInvalidConcurrency &&
      options.concurrency !== undefined &&
      requested === undefined
    ) {
      FfiBackend.warnedInvalidConcurrency = true;
      logger.warn(
        `FFI concurrency must be a positive finite number, got ${options.concurrency}; using the threadpool size (${pool}).`,
      );
    }
    // Must run before koffi.load(): koffi's config is frozen once a library is loaded.
    const max = FfiBackend.ensureAsyncLimit(requested ?? pool);
    this.fns = LibraryHandler.retrieveLibrary();
    // Floor of 1: a host may have configured max_async_calls to 0.
    const permits = Math.max(1, Math.min(requested ?? pool, max));
    this.sem = new Semaphore(permits);

    if (
      !FfiBackend.warnedOverProvision &&
      requested !== undefined &&
      requested > pool
    ) {
      FfiBackend.warnedOverProvision = true;
      logger.warn(
        `FFI concurrency ${requested} exceeds the libuv threadpool size (${pool}); the excess only queues and adds no parallelism. Set UV_THREADPOOL_SIZE before starting Node to run more requests at once.`,
      );
    }
  }

  /** The libuv threadpool size this process will run with (best effort, see index.ts). */
  static threadpoolSize(): number {
    // parseInt("") / parseInt(undefined) → NaN → cores*2 fallback; "64" → 64.
    const raw = parseInt(process.env.UV_THREADPOOL_SIZE ?? "", 10);
    return Math.min(
      raw > 0 ? raw : cpuCount() * 2,
      FfiBackend.LIBUV_MAX_THREADPOOL,
    );
  }

  /**
   * Tune koffi for our call pattern: raise the async-call ceiling so the
   * semaphore (not koffi) throttles, and keep as many async memory pools
   * resident as we expect calls in flight, so steady-state requests reuse
   * pools instead of mmap/munmap-ing 256 KiB each. The setter throws once ANY
   * koffi library is loaded in the process (ffi.cc:102) — our own after a
   * destroyTLS()/initTLS() cycle, or a host app's — so read first and only
   * set when something is below target. Returns the call limit in effect.
   */
  private static ensureAsyncLimit(expectedInFlight: number): number {
    const current = koffiConfig();
    let max = current.max_async_calls ?? 256;
    const residentTarget = Math.min(
      FfiBackend.KOFFI_MAX_RESIDENT_POOLS,
      Math.max(1, Math.floor(expectedInFlight)),
    );
    const resident = current.resident_async_pools ?? 4;
    if (max < FfiBackend.KOFFI_MAX_ASYNC_CALLS || resident < residentTarget) {
      try {
        koffiConfig({
          max_async_calls: FfiBackend.KOFFI_MAX_ASYNC_CALLS,
          resident_async_pools: Math.max(resident, residentTarget),
        });
        max = FfiBackend.KOFFI_MAX_ASYNC_CALLS;
      } catch (e) {
        if (!FfiBackend.warnedConfig) {
          FfiBackend.warnedConfig = true;
          logger.warn(
            `could not raise koffi max_async_calls to ${FfiBackend.KOFFI_MAX_ASYNC_CALLS} (${e instanceof Error ? e.message : e}); in-flight native calls are capped at ${max}.`,
          );
        }
      }
    }
    return max;
  }

  private async gated<T>(fn: () => Promise<T>): Promise<T> {
    await this.sem.acquire();
    try {
      return await fn();
    } finally {
      this.sem.release();
    }
  }

  request(payload: Payload): Promise<string> {
    return this.gated(() => this.fns.request(JSON.stringify(payload)));
  }

  destroySession(sessionId: string): Promise<string> {
    return this.gated(() =>
      this.fns.destroySession(JSON.stringify({ sessionId })),
    );
  }

  freeMemory(id: string): void {
    if (id) this.fns.freeMemory(id);
  }

  async destroy(): Promise<void> {
    // Reject new calls, let admitted ones finish (Piscina close() parity)…
    await this.sem.close();
    // …then clear native session state. Ungated on purpose: the gate is
    // closed and nothing else is running. The koffi library itself stays
    // loaded process-wide; there is nothing to unload.
    const raw = await this.fns.destroyAll();
    this.freeMemory(parseNativeId(raw));
  }
}
