import { cpuCount } from "./utils/cores";
if (!process.env.UV_THREADPOOL_SIZE) {
  // Node reads this once on first threadpool use; if the host app
  // touched the pool before importing us it's ignored — set it in the real env
  // for guaranteed effect. cores*2 is a sane default that helps the common case.
  process.env.UV_THREADPOOL_SIZE = String(cpuCount() * 2);
}

export * from "./interface";
export * from "./core";
