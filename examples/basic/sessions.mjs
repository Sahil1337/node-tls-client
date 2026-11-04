import { initTLS, destroyTLS, Session } from "node-tls-client";

await initTLS();

//#region lifecycle
const session = new Session({ timeout: 10_000 });
try {
  // The first response sets a cookie...
  await session.get("https://httpbin.org/cookies/set/visited/yes");
  // ...and the session's cookie jar sends it on every later request.
  const res = await session.get("https://httpbin.org/cookies");
  console.log(await res.json()); // { cookies: { visited: 'yes' } }
} finally {
  await session.close(); // frees the cookie jar and connections
}
//#endregion

//#region shared-id
// Same sessionId → same native session: one cookie jar, one connection pool.
const a = new Session({ sessionId: "worker-1" });
const b = new Session({ sessionId: "worker-1" });
await a.get("https://httpbin.org/cookies/set/token/abc");
const fromB = await b.get("https://httpbin.org/cookies");
console.log(await fromB.json()); // { cookies: { token: 'abc' } }
await a.close(); // frees it for both
//#endregion

await destroyTLS();
