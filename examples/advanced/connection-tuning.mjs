import { initTLS, destroyTLS, Session } from "node-tls-client";

await initTLS();

//#region transport
const session = new Session({
  transportOptions: {
    maxIdleConnsPerHost: 10, // keep up to 10 warm connections per host
    maxConnsPerHost: 20, // never open more than 20 at once per host
    idleConnTimeout: 90 * 1e9, // nanoseconds: close idle connections after 90 s
  },
});
//#endregion
console.log((await session.get("https://httpbin.org/get")).status);

//#region http1
const http1 = new Session({ forceHttp1: true });
const res = await http1.get("https://httpbin.org/get");
console.log(res.usedProtocol); // HTTP/1.1
//#endregion

//#region ip-family
const ipv4Only = new Session({ disableIPV6: true });
//#endregion
console.log((await ipv4Only.get("https://httpbin.org/get")).status);

await Promise.all([session.close(), http1.close(), ipv4Only.close()]);
await destroyTLS();
