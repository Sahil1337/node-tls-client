<div align="center">
  <h1>node-tls-client</h1>
  <p>A Node.js HTTP client that looks like a real browser at the TLS and HTTP/2 level.</p>
  <p>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://img.shields.io/npm/v/node-tls-client?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://img.shields.io/npm/dt/node-tls-client?maxAge=3600" alt="NPM downloads" /></a>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://nodei.co/npm/node-tls-client.png?downloads=true&stars=true" alt="NPM Banner"></a>
  </p>
  <p><b><a href="https://sahil1337.github.io/node-tls-client/">Documentation</a></b></p>
</div>

Changing the `User-Agent` isn't enough to look like a browser: servers can recognise the client from its TLS handshake and HTTP/2 settings (**TLS fingerprinting**: JA3, JA4, Akamai). node-tls-client sends requests through [bogdanfinn/tls-client](https://github.com/bogdanfinn/tls-client), which reproduces the handshake of real browsers, behind a `fetch`-like API.

## Installation

```sh
npm install node-tls-client
```

Requires Node.js 20 or newer. The native library is downloaded on first use; see [Installation](https://sahil1337.github.io/node-tls-client/installation) for platforms (Alpine/musl isn't supported yet) and offline installs.

## Quick start

```js
import {
  initTLS,
  destroyTLS,
  Session,
  ClientIdentifier,
} from "node-tls-client";

await initTLS();

const session = new Session({
  clientIdentifier: ClientIdentifier.chrome_150,
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
  },
  timeout: 10_000,
});

const res = await session.get("https://tls.peet.ws/api/all");
console.log(res.status, (await res.json()).tls.ja4);

await session.close();
await destroyTLS();
```

The profile sets the handshake, not the headers: always send a `user-agent` that matches it. More in the [Quick start](https://sahil1337.github.io/node-tls-client/quick-start).

## Guides

- [Sessions](https://sahil1337.github.io/node-tls-client/guides/sessions), [requests](https://sahil1337.github.io/node-tls-client/guides/requests) and [responses](https://sahil1337.github.io/node-tls-client/guides/responses)
- [Headers](https://sahil1337.github.io/node-tls-client/guides/headers) and [cookies](https://sahil1337.github.io/node-tls-client/guides/cookies)
- [Proxies](https://sahil1337.github.io/node-tls-client/guides/proxies), HTTP and SOCKS5
- [Browser profiles](https://sahil1337.github.io/node-tls-client/guides/browser-profiles) and [custom fingerprints](https://sahil1337.github.io/node-tls-client/guides/custom-fingerprints)
- [HTTP/3](https://sahil1337.github.io/node-tls-client/guides/http3), including known issues
- [Concurrency](https://sahil1337.github.io/node-tls-client/guides/concurrency) and [errors](https://sahil1337.github.io/node-tls-client/guides/errors)
- [Every session option](https://sahil1337.github.io/node-tls-client/reference/session-options), grouped

Upgrading from 2.1? Check the [changelog](https://sahil1337.github.io/node-tls-client/changelog): request headers now merge over session headers, and the default profile is `chrome_150`.

Runnable versions of every example are in [`examples/`](examples).

## Acknowledgements

This library is based on [bogdanfinn's](https://github.com/bogdanfinn) tls client in golang. A big thanks to him.
