// docs:no-run (needs real proxies)
import { initTLS, destroyTLS, Session } from "node-tls-client";

await initTLS();

//#region session
// Every request of this session goes through the proxy.
const session = new Session({
  proxy: "http://user:pass@proxy.example.com:8080",
});
await session.get("https://httpbin.org/ip");
//#endregion

//#region per-request
// A different proxy for one request. The next request goes back to the
// session's proxy (or none).
await session.get("https://httpbin.org/ip", {
  proxy: "http://user:pass@other-proxy.example.com:8080",
});
//#endregion

//#region socks5
const socks = new Session({
  proxy: "socks5://user:pass@proxy.example.com:1080",
});
//#endregion

//#region rotating
// The provider hands out a new exit IP per connection: re-apply the proxy
// before every request instead of reusing pooled connections.
const rotating = new Session({
  proxy: "http://user:pass@rotating.example.com:8000",
  isRotatingProxy: true,
});
//#endregion

await Promise.all([session.close(), socks.close(), rotating.close()]);
await destroyTLS();
