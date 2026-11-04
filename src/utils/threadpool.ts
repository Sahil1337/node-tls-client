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
