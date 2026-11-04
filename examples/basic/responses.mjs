import { initTLS, destroyTLS, Session } from "node-tls-client";
import { rmSync, writeFileSync } from "node:fs";

await initTLS();
const session = new Session({ timeout: 10_000 });

//#region read
const res = await session.get("https://httpbin.org/json");
console.log(res.ok, res.status, res.usedProtocol); // true 200 HTTP/2.0

// Every header value is an array.
console.log(res.headers["Content-Type"]); // [ 'application/json' ]

const data = await res.json(); // or res.text(), or res.body
console.log(data.slideshow.title); // Sample Slide Show
//#endregion

//#region binary
const image = await session.get("https://httpbin.org/image/png", {
  byteResponse: true,
});
// The body is a data URL: data:image/png;base64,iVBORw0KGgo…
const base64 = image.body.slice(image.body.indexOf(",") + 1);
writeFileSync("image.png", Buffer.from(base64, "base64"));
//#endregion
rmSync("image.png");

//#region failed
const failed = await session.get("https://does-not-exist.invalid/");
if (failed.status === 0) {
  console.log(failed.body); // failed to do request: … no such host
}
//#endregion

await session.close();
await destroyTLS();
