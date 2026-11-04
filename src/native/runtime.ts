/**
 * The process-wide client and its initTLS()/destroyTLS() lifecycle: which
 * NativeClient is live, how one is built for the loaded binary, and how
 * concurrent init/destroy calls are serialized.
 */

import { isMainThread } from "worker_threads";
import { ClientLimits } from "../types/client";
import { InitTLSOptions } from "../types/native";
import { TlsClientError, logger, threadpoolSize } from "../utils";
import { NativeClient, QueueClient, ThreadpoolClient } from "./client";

let client: NativeClient | null = null;
let pending: Promise<void> | null = null;
let destroying: Promise<void> | null = null;

/**
 * Builds the client on first use; calling it again while initialized is a
 * no-op that warns the new options are ignored.
 */
export async function initClient(options: InitTLSOptions = {}): Promise<void> {
  // A destroy in progress nulls `client` when it finishes, so wait for it
  // and create a fresh client with these options. Its failure is its
  // caller's to handle; the client is cleared either way.
  await destroying?.catch(() => {});
  if (client) {
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
  pending ??= create(options).finally(() => {
    pending = null;
  });
  await pending;
}

export async function destroyClient(): Promise<void> {
  // Concurrent callers share one close(); a second would run destroyAll()
  // again. Waits for in-flight requests (each bounded by its own timeout;
  // native defaults to 30 s when none is set). Returning early would let
  // this client's deferred destroyAll() wipe the sessions of a later
  // initTLS().
  destroying ??= getClient()
    .close()
    .finally(() => {
      client = null;
      destroying = null;
    });
  await destroying;
}

export function getClient(): NativeClient {
  if (!client) {
    throw new TlsClientError("Client not initialized. Call initTLS() first.");
  }
  return client;
}

/** Tests: make a client over stubbed bindings the live one, or `null` to remove it. */
export function setClient(next: NativeClient | null): void {
  client = next;
}

async function create(options: InitTLSOptions): Promise<void> {
  // Dynamic import: defers loading koffi's native addon until initTLS(),
  // so merely importing this package never touches native code.
  const { locateLibrary, loadLibrary } = await import("./library");
  const libPath = await locateLibrary({
    dir: options.libraryDir,
    binary: options.binary,
  });

  const pool = threadpoolSize();
  const requested = requestedConcurrency(options);
  const { bindings, maxAsyncCalls } = loadLibrary(libPath, requested ?? pool);
  const limits: ClientLimits = { requested, pool, maxAsyncCalls };
  const { queue } = bindings;
  if (queue && isMainThread) {
    client = QueueClient.fromLimits({ ...bindings, queue }, limits);
    return;
  }
  if (queue) {
    // The completion queue and its callback are one per process: a worker
    // using them would take the main thread's responses and vice versa.
    logger.warnOnce(
      "queue-worker",
      "node-tls-client's binary runs requests without a thread only on the main thread; in this worker thread each request holds a libuv threadpool thread, as with the upstream binary.",
    );
  }
  client = ThreadpoolClient.fromLimits(bindings, limits);
}

/**
 * `concurrency`, or `undefined` when unset or invalid: 0 or NaN would give
 * the semaphore 0 permits and every request would wait forever.
 */
function requestedConcurrency({
  concurrency,
}: InitTLSOptions): number | undefined {
  if (concurrency === undefined) return undefined;
  if (Number.isFinite(concurrency) && concurrency > 0) return concurrency;
  logger.warnOnce(
    "invalid-concurrency",
    `FFI concurrency must be a positive finite number, got ${concurrency}; using the default.`,
  );
  return undefined;
}
