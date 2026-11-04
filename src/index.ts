import { isMainThread } from "worker_threads";
import { logger } from "./utils/logger";
import {
  defaultThreadpoolSize,
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
  if (threadpoolDefaultIgnored(process.versions.node, true, esmEntry)) {
    logger.warnOnce(
      "threadpool-default-ignored",
      `On Node ${process.version} with an ES module entry file, Node starts its threadpool before node-tls-client loads, so the default UV_THREADPOOL_SIZE of ${size} did not apply and at most 4 requests run in parallel. Set it in the environment instead: UV_THREADPOOL_SIZE=${size} node app.mjs`,
    );
  }
}

export * from "./types";
export * from "./core";
export { TlsClientError } from "./utils/tlsError";
