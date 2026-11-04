// Type-only: compiled away, so utils never loads koffi (native/library/load.ts does).
import type { KoffiFunction } from "koffi";

/**
 * Promisify a koffi `.async` function: runs the (blocking cgo) call on a
 * libuv threadpool thread and resolves/rejects the Node-style callback.
 */
export function promisify(
  f: KoffiFunction,
): (...args: string[]) => Promise<string> {
  return (...args) =>
    new Promise((resolve, reject) =>
      f.async(...args, (err: Error | null, result: string) =>
        err ? reject(err) : resolve(result),
      ),
    );
}

/**
 * Call a koffi function on the calling thread and return its result as an
 * already-settled promise, so it fits where a `promisify`d call would.
 */
export function promisifySync(
  f: KoffiFunction,
): (...args: string[]) => Promise<string> {
  return async (...args) => f(...args);
}
