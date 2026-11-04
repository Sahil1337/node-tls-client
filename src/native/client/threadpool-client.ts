import { TlsNativeLibrary } from "../../types/native";
import { lateThreadpoolDefault, logger } from "../../utils";
import { ClientLimits } from "../../types/client";
import { NativeClient } from "./native-client";

/**
 * Upstream's binary: each request is one koffi `.async` call that holds a
 * libuv threadpool thread until native returns, so the threadpool size is
 * both the real parallelism and the default in-flight cap.
 */
export class ThreadpoolClient extends NativeClient {
  constructor(lib: TlsNativeLibrary, permits: number) {
    super(lib, permits);
  }

  /** Sizes the gate from the threadpool and warns about settings that can't take effect. */
  static fromLimits(
    lib: TlsNativeLibrary,
    { requested, pool, maxAsyncCalls }: ClientLimits,
  ): ThreadpoolClient {
    const late = lateThreadpoolDefault();
    if (late !== null) {
      logger.warnOnce(
        "threadpool-default-ignored",
        `On Node ${process.version} with an ES module entry file, Node starts its threadpool before node-tls-client loads, so the default UV_THREADPOOL_SIZE of ${late} did not apply and at most 4 requests run in parallel. Set it in the environment instead: UV_THREADPOOL_SIZE=${late} node app.mjs`,
      );
    }
    if (requested !== undefined && requested > pool) {
      logger.warnOnce(
        "over-provision",
        `FFI concurrency ${requested} exceeds the libuv threadpool size (${pool}); the excess only queues and adds no parallelism. Set UV_THREADPOOL_SIZE before starting Node to run more requests at once.`,
      );
    }
    // Floor of 1: a host may have configured max_async_calls to 0.
    return new ThreadpoolClient(
      lib,
      Math.max(1, Math.min(requested ?? pool, maxAsyncCalls)),
    );
  }

  protected send(json: string): Promise<string> {
    return this.lib.request(json);
  }
}
