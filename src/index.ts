import { isMainThread } from "worker_threads";
import {
  defaultThreadpoolSize,
  noteLateThreadpoolDefault,
  threadpoolDefaultIgnored,
} from "./utils/threadpool";

if (!process.env.UV_THREADPOOL_SIZE) {
  // Node reads this once on first threadpool use; if the host app
  // touched the pool before importing us it's ignored — set it in the real env
  // for guaranteed effect. cores*2 is a sane default that helps the common case.
  const size = defaultThreadpoolSize();
  process.env.UV_THREADPOOL_SIZE = String(size);

  // An ES module entry file has no `require.main`; `node -e` and the REPL have
  // no entry file at all (no `process.argv[1]`). Workers share the main
  // thread's pool, so only the main thread can tell.
  const esmEntry =
    isMainThread &&
    typeof require === "function" &&
    require.main === undefined &&
    !!process.argv[1];
  // initTLS() warns, once it knows the binary needs the threadpool.
  if (threadpoolDefaultIgnored(process.versions.node, true, esmEntry)) {
    noteLateThreadpoolDefault(size);
  }
}

export * from "./types";
export * from "./core";
export { TlsClientError } from "./utils/tlsError";
