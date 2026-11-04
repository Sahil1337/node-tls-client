import { initTLS, destroyTLS, fetch, ClientIdentifier } from "node-tls-client";

await initTLS();

//#region fetch
// One request in a throwaway session: its own profile and timeout,
// closed as soon as the response arrives.
const res = await fetch("https://httpbin.org/post", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ hello: "world" }),
  options: { clientIdentifier: ClientIdentifier.firefox_148, timeout: 5000 },
});

const echoed = await res.json();
console.log(res.status, echoed.json); // 200 { hello: 'world' }
//#endregion

await destroyTLS();
