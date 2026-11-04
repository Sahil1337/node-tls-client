import { initTLS, destroyTLS, Session } from "node-tls-client";
import { readFileSync } from "node:fs";

await initTLS();
const session = new Session({ timeout: 10_000 });

//#region json
const created = await session.post("https://httpbin.org/post", {
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "Ada" }), // objects must be stringified
});
console.log((await created.json()).json); // { name: 'Ada' }
//#endregion

//#region form
const form = new URLSearchParams({ q: "tls fingerprint", page: "2" });
const searched = await session.post("https://httpbin.org/post", {
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: form.toString(),
});
console.log((await searched.json()).form); // { page: '2', q: 'tls fingerprint' }
//#endregion

//#region binary
// A Buffer or Uint8Array is sent as raw bytes (here: this file itself).
const bytes = readFileSync(new URL(import.meta.url));
const uploaded = await session.put("https://httpbin.org/put", {
  headers: { "content-type": "application/octet-stream" },
  body: bytes,
});
console.log(uploaded.status, (await uploaded.json()).data.length > 0); // 200 true
//#endregion

//#region redirects
const hop = await session.get("https://httpbin.org/redirect/2");
console.log(hop.status, hop.headers.Location); // 302 [ '/relative-redirect/1' ]

const landed = await session.get("https://httpbin.org/redirect/2", {
  followRedirects: true,
});
console.log(landed.status, landed.url); // 200 https://httpbin.org/get
//#endregion

//#region methods
await session.delete("https://httpbin.org/delete");
await session.patch("https://httpbin.org/patch", { body: "x=1" });
const head = await session.head("https://httpbin.org/get");
console.log(head.status, head.body); // 200 '' (HEAD has no body)
//#endregion

await session.close();
await destroyTLS();
