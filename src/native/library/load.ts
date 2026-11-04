/**
 * Loads the tls-client shared library with koffi and binds its exports. The
 * only module that imports koffi; ../runtime.ts imports it lazily from
 * initTLS().
 */

import {
  IKoffiRegisteredCallback,
  KoffiFunction,
  config as koffiConfig,
  load,
  pointer,
  proto,
  register,
} from "koffi";
import {
  TlsCompletion,
  TlsNativeLibrary,
  TlsNativeQueue,
} from "../../types/native";
import {
  TlsClientError,
  errorMessage,
  hasGlibc,
  logger,
  promisify,
  promisifySync,
} from "../../utils";

/**
 * koffi's hard `max_async_calls` ceiling (ffi.hh:20). koffi's running+queued
 * limit is raised to it so the semaphore, not koffi, is the throttle.
 */
const KOFFI_MAX_ASYNC_CALLS = 4096;
/** koffi keeps at most this many async memory pools resident (misc.md "Default settings"). */
const KOFFI_MAX_RESIDENT_POOLS = 16;

export interface LoadedLibrary {
  bindings: TlsNativeLibrary;
  /** koffi's `max_async_calls` in effect: the most native calls that may be in flight. */
  maxAsyncCalls: number;
}

/**
 * The library this process loaded, if any. There is no unloading, and a second
 * copy would start a second Go runtime in the same process, which Go does not
 * support — so the first copy stays in use for the life of the process and is
 * reused across destroyTLS()/initTLS() cycles, whatever directory they name.
 */
let loaded: { path: string; bindings: TlsNativeLibrary } | null = null;

/** The library this process loaded, or `null` before the first initTLS(). */
export function loadedLibrary(): typeof loaded {
  return loaded;
}

/**
 * Load the library at `libPath` (tuning koffi first) and bind its exports.
 * `expectedInFlight` sizes koffi's resident async memory pools.
 */
export function loadLibrary(
  libPath: string,
  expectedInFlight: number,
): LoadedLibrary {
  // Must run before load(): koffi's config is frozen once a library is loaded.
  const maxAsyncCalls = raiseAsyncLimit(expectedInFlight);
  // Keep the loaded copy even if `libPath` names another file; see `loaded`.
  if (!loaded) loaded = { path: libPath, bindings: bind(libPath) };
  return { bindings: loaded.bindings, maxAsyncCalls };
}

function bind(libPath: string): TlsNativeLibrary {
  let library: ReturnType<typeof load>;
  try {
    library = load(libPath);
  } catch (e) {
    let message = `Failed to load the tls-client shared library at ${libPath}: ${errorMessage(e)}`;
    if (process.platform === "linux" && !hasGlibc()) {
      message +=
        ". This looks like a musl-based system (e.g. Alpine): this version only downloads glibc-linked binaries, so alpine/musl is not supported yet — use a glibc-based image such as node:<version>-slim.";
    }
    throw new TlsClientError(message);
  }

  const queue = bindQueue(library);
  // With the completion queue, requests don't need the threadpool, so the
  // session calls don't either: natively they only close idle connections
  // under a lock and never wait on the network.
  const session = queue ? promisifySync : promisify;
  return {
    request: promisify(library.func("request", "string", ["string"])),
    // Sync on purpose: natively a mutex-guarded map delete + C.free.
    freeMemory: library.func("freeMemory", "void", ["string"]) as (
      id: string,
    ) => void,
    destroyAll: session(library.func("destroyAll", "string", [])),
    destroySession: session(
      library.func("destroySession", "string", ["string"]),
    ),
    queue,
  };
}

/**
 * The completion-queue exports, or `undefined` when the binary has none
 * (upstream's builds): koffi throws for a function the library lacks.
 */
function bindQueue(
  library: ReturnType<typeof load>,
): TlsNativeQueue | undefined {
  let requestAsync: KoffiFunction;
  let waitNext: KoffiFunction;
  let setNotify: KoffiFunction;
  // `void (*)(void)`. Anonymous: koffi type names are process-wide, so a
  // named one could clash with a host app's.
  const notifyFn = pointer(proto("void", []));
  try {
    requestAsync = library.func(
      "uint64_t requestAsync(const char *requestParams)",
    );
    waitNext = library.func(
      "const char *waitNext(int timeoutMs, _Out_ uint64_t *ticket)",
    );
    setNotify = library.func("setNotify", "void", [notifyFn]);
  } catch {
    return undefined;
  }
  // koffi writes the ticket into box[0], as a BigInt only past 2^53.
  const completion = (
    response: string | null,
    box: [number | bigint],
  ): TlsCompletion | null =>
    response === null ? null : { ticket: Number(box[0]), response };

  // One koffi callback for the life of the process, pointing at whichever
  // handler is current. Never unregistered: native may already be calling
  // it when setNotify() swaps it out (that call waits for this thread, so
  // setNotify can't wait for it). koffi fails a call to a callback
  // unregistered in between with an exception Node swallows by default and
  // dies of under --force-node-api-uncaught-exceptions-policy, and would
  // run whatever callback reuses the slot.
  let handler: (() => void) | null = null;
  let notify: IKoffiRegisteredCallback | null = null;
  return {
    requestAsync: (payload) => Number(requestAsync(payload)),
    waitNext: (timeoutMs) => {
      const box: [number | bigint] = [0];
      return completion(waitNext(timeoutMs, box), box);
    },
    onReady: (next) => {
      handler = next;
      if (next) notify ??= register(() => handler?.(), notifyFn);
      setNotify(next ? notify : null);
    },
  };
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
function raiseAsyncLimit(expectedInFlight: number): number {
  const current = koffiConfig();
  const max = current.max_async_calls ?? 256;
  // Our own library is loaded, so the config is frozen and was already tuned by
  // the first init (or already warned about): `max` is final, and only the
  // resident-pool count could differ, which is a perf nicety, not worth a warning.
  if (loaded) return max;
  const resident = current.resident_async_pools ?? 4;
  const residentTarget = Math.min(
    KOFFI_MAX_RESIDENT_POOLS,
    Math.max(1, Math.floor(expectedInFlight)),
  );
  if (max >= KOFFI_MAX_ASYNC_CALLS && resident >= residentTarget) return max;
  try {
    koffiConfig({
      max_async_calls: KOFFI_MAX_ASYNC_CALLS,
      resident_async_pools: Math.max(resident, residentTarget),
    });
    return KOFFI_MAX_ASYNC_CALLS;
  } catch (e) {
    // A host app loaded a koffi library before us. Only a call limit actually
    // below the ceiling is worth reporting; the resident pools are a nicety.
    if (max < KOFFI_MAX_ASYNC_CALLS) {
      logger.warnOnce(
        "koffi-config",
        `could not raise koffi max_async_calls to ${KOFFI_MAX_ASYNC_CALLS} (${errorMessage(e)}); in-flight native calls are capped at ${max}.`,
      );
    }
    return max;
  }
}
