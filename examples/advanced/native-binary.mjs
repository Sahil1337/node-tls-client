import { initTLS, destroyTLS, Session } from "node-tls-client";

//#region opt-in
// Our build of tls-client: a request holds no thread while it waits.
await initTLS({ binary: "node-tls-client" });
//#endregion

//#region at-once
const session = new Session({ timeout: 15_000 });
const urls = Array.from(
  { length: 20 },
  (_, i) => `https://httpbin.org/anything/${i}`,
);

// Every request starts right away, however many there are, like node-fetch.
const responses = await Promise.all(urls.map((url) => session.get(url)));
console.log(responses.map((r) => r.status)); // [ 200, 200, … ]
//#endregion

await session.close();
await destroyTLS();
