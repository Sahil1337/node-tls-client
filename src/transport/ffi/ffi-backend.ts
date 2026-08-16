import { config as koffiConfig } from "koffi";
import { Backend, InitTLSOptions } from "../../interface";
import { TlsNativeLibrary } from "../../interface/native";
import { cpuCount, logger } from "../../utils";
import { LibraryHandler } from "./native";
import { Semaphore } from "./semaphore";

// 4096 is koffi's hard `max_async_calls` ceiling (ffi.hh:20) — raise koffi's
// running+queued limit to the max so the semaphore, not koffi, is the throttle.
koffiConfig({ max_async_calls: 4096 });

// One-time over-provision warning across the process (survives destroyTLS +
// re-init) so repeated initTLS doesn't spam.
let warned = false;
let warnedInvalidConcurrency = false;

function threadpoolSize(): number {
  // parseInt("",10)/parseInt(undefined,10) → NaN → falsy → cores*2 fallback
  // (no NaN-permit deadlock); UV_THREADPOOL_SIZE=64 → 64.
  return parseInt(process.env.UV_THREADPOOL_SIZE ?? "", 10) || cpuCount() * 2;
}

export class FfiBackend implements Backend {
  private fns: TlsNativeLibrary;
  private sem: Semaphore;

  constructor(options: InitTLSOptions = {}) {
    this.fns = LibraryHandler.retrieveLibrary();

    const pool = threadpoolSize();
    // concurrency:0 or NaN would give the semaphore 0 permits — every request
    // would await acquire() forever, with no error or timeout. Treat any
    // non-positive/non-finite value as "unset" instead.
    const requested =
      options.concurrency !== undefined &&
      Number.isFinite(options.concurrency) &&
      options.concurrency > 0
        ? options.concurrency
        : undefined;
    if (
      !warnedInvalidConcurrency &&
      options.concurrency !== undefined &&
      requested === undefined
    ) {
      warnedInvalidConcurrency = true;
      logger.warn(
        `FFI concurrency must be a positive finite number, got ${options.concurrency}; falling back to UV_THREADPOOL_SIZE default (${pool}).`,
      );
    }
    const permits = Math.min(requested ?? pool, 4096);
    this.sem = new Semaphore(permits);

    // D7: explicit over-provision → one-time warn. Excess only grows queue
    // depth; real parallelism is capped by UV_THREADPOOL_SIZE.
    if (
      !warned &&
      options.concurrency !== undefined &&
      options.concurrency > pool
    ) {
      warned = true;
      logger.warn(
        `FFI concurrency ${options.concurrency} > UV_THREADPOOL_SIZE ${pool}; excess only queues (no added parallelism). Raise UV_THREADPOOL_SIZE, or use server mode for true high concurrency.`,
      );
    }
  }

  private async gated<T>(fn: () => Promise<T>): Promise<T> {
    await this.sem.acquire();
    try {
      return await fn();
    } finally {
      this.sem.release();
    }
  }

  async request(payload: string): Promise<string> {
    if (!payload) return "";
    return this.gated(() => this.fns.request(payload));
  }

  async destroySession(payload: string): Promise<string> {
    if (!payload) return "";
    return this.gated(() => this.fns.destroySession(payload));
  }

  async freeMemory(id: string): Promise<void> {
    if (!id) return;
    await this.gated(() => this.fns.freeMemory(id));
  }

  async destroyAll(): Promise<string> {
    return this.gated(() => this.fns.destroyAll());
  }

  async destroy(): Promise<void> {
    // koffi lib stays loaded process-wide — nothing to unload. Wait for
    // in-flight requests to finish first (Piscina's close({force:false})
    // parity), so destroyTLS() doesn't abandon them mid-flight.
    await this.sem.drain();
  }
}
