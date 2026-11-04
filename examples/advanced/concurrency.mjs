import { initTLS, destroyTLS, Session } from "node-tls-client";

//#region parallel
// Run with: UV_THREADPOOL_SIZE=64 node concurrency.mjs
await initTLS({ concurrency: 64 }); // at most 64 requests in flight

const session = new Session({ timeout: 15_000 });
const urls = Array.from(
  { length: 20 },
  (_, i) => `https://httpbin.org/anything/${i}`,
);

// Start them all at once; up to UV_THREADPOOL_SIZE run in parallel,
// the rest wait in a queue.
const responses = await Promise.all(urls.map((url) => session.get(url)));
console.log(responses.map((r) => r.status)); // [ 200, 200, … ]
//#endregion

await session.close();
await destroyTLS();
