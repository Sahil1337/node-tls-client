import os from "os";

/** libuv silently caps UV_THREADPOOL_SIZE here (threadpool.c MAX_THREADPOOL_SIZE). */
const LIBUV_MAX_THREADPOOL = 1024;

/** cores×2: the threadpool size this library sets when UV_THREADPOOL_SIZE is unset. */
export function defaultThreadpoolSize(): number {
  return os.availableParallelism() * 2;
}

/** The libuv threadpool size this process will run with (best effort, see index.ts). */
export function threadpoolSize(): number {
  // parseInt("") → NaN → default; "64" → 64.
  const raw = parseInt(process.env.UV_THREADPOOL_SIZE ?? "", 10);
  return Math.min(
    raw > 0 ? raw : defaultThreadpoolSize(),
    LIBUV_MAX_THREADPOOL,
  );
}

/**
 * Node versions whose ES module entry runs file reads on the libuv threadpool
 * before any user code, which starts the pool at 4 threads (fixed in 22.18.0,
 * 24.3.0 and 25.0.0; the 20.x line never got the fix).
 */
function startsPoolBeforeUserCode(nodeVersion: string): boolean {
  const [major, minor] = nodeVersion.split(".").map(Number);
  if (major === 22) return minor < 18;
  if (major === 24) return minor < 3;
  return major < 25;
}

/**
 * Whether the default `UV_THREADPOOL_SIZE` set at import was too late to apply:
 * this package set it (`setByUs`), the app's entry file is an ES module
 * (`esmEntry`), and `nodeVersion` (e.g. `process.versions.node`) starts the pool
 * before user code runs.
 */
export function threadpoolDefaultIgnored(
  nodeVersion: string,
  setByUs: boolean,
  esmEntry: boolean,
): boolean {
  return setByUs && esmEntry && startsPoolBeforeUserCode(nodeVersion);
}

/** The default this package set at import, when it came too late to apply. */
let lateDefault: number | null = null;

/**
 * Called at import (index.ts), where the entry file can still be told apart.
 * Reported by initTLS(), and only with upstream's binary: the completion
 * queue doesn't need the threadpool.
 */
export function noteLateThreadpoolDefault(size: number): void {
  lateDefault = size;
}

/** The ignored default noted at import, or `null` when the default applied. */
export function lateThreadpoolDefault(): number | null {
  return lateDefault;
}
