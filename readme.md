<div align="center">
  <h1>node-tls-client</h1>
  <p>Advanced library based on node-fetch syntax and tls-client.</p>
  <p>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://img.shields.io/npm/v/node-tls-client?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://img.shields.io/npm/dt/node-tls-client?maxAge=3600" alt="NPM downloads" /></a>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://nodei.co/npm/node-tls-client.png?downloads=true&stars=true" alt="NPM Banner"></a>
  </p>
</div>

<div align="center"> <p> <b> What is TLS Fingerprinting? </b> </p>
Some people think it is enough to change the user-agent header of a request to let the server think that the client requesting a resource is a specific browser. Nowadays this is not enough, because the server might use a technique to detect the client browser which is called TLS Fingerprinting. <b>This library aims to defeat it.</b> </p></div>

## Installation

```sh
npm install node-tls-client
# (or)
yarn add node-tls-client
# (or)
pnpm add node-tls-client
```

## Example

```javascript
const {
  Session,
  ClientIdentifier,
  initTLS,
  destroyTLS,
} = require("node-tls-client");

/**
 * @description Demonstrates using the node-tls-client library to make HTTP requests with a specified timeout.
 * Note: The timeout is set per session and cannot be changed during the session.
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions} for more details.
 */
(async () => {
  await initTLS();

  const session = new Session({
    clientIdentifier: ClientIdentifier.chrome_103,
    timeout: 3000,
  });

  try {
    const response = await session.get("https://website.com/");

    console.log(response.status, await response.text());
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await session.close();
    await destroyTLS();
  }
})();
```

## Concurrency & scaling

Requests run through the native library with koffi's asynchronous calls. Each in-flight request holds one libuv threadpool thread for its full round-trip, so:

- **Parallelism = `UV_THREADPOOL_SIZE`**, fixed when the threadpool starts. This library sets it to `cores×2` at import time when unset; libuv caps it at `1024`. Set `UV_THREADPOOL_SIZE=4` to keep Node's default, or raise it before starting Node:

  ```sh
  UV_THREADPOOL_SIZE=64 node app.js
  ```

  The import-time default only takes effect if nothing used the threadpool before this package was imported (e.g. `fs.promises`, DNS lookups); set it in the real environment for a guaranteed effect.

  Native calls share that threadpool with Node's own `fs`, DNS, zlib and crypto work. Under sustained load with a small pool those operations wait behind in-flight requests, so size `UV_THREADPOOL_SIZE` for both.

- **`initTLS({ concurrency })`** caps how many native calls are in flight at once (admission depth, default = the threadpool size). Values above the threadpool size only queue and add no parallelism; every in-flight call reserves about 256 KiB in koffi (committed memory on Windows).

### `initTLS(options?)`

| Option        | Type     | Default                                   | Description                                                                  |
| ------------- | -------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `concurrency` | `number` | `UV_THREADPOOL_SIZE` (cores×2 when unset) | Maximum in-flight native calls. Clamped to koffi's `max_async_calls` (4096). |

`initTLS()` with no arguments behaves exactly as before.

### Native library

`initTLS()` downloads the newest [tls-client](https://github.com/bogdanfinn/tls-client) release for your platform into `os.tmpdir()` (named after this package's version, so an upgrade downloads once) on first use. No GitHub API calls are made (no anonymous rate limit). If the download fails but an older cached binary exists, that binary is used with a warning; otherwise a `TlsClientError` is thrown, the process stays alive and `initTLS()` can be retried.

| Platform                          | Supported                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------- |
| macOS x64 / arm64                 | yes                                                                           |
| Linux x64 / arm64 / armv7 (glibc) | yes                                                                           |
| Linux musl (Alpine)               | **no** — upstream ships glibc-linked binaries only; use `node:<version>-slim` |
| Windows x64 / ia32                | yes                                                                           |

Requires Node.js ≥ 20.

## Headers

Session `headers` are defaults; per-request `headers` layer over them **per key** (case-insensitive — the request's value and casing win). Pass `null` to drop a session header for one request. When neither side provides headers, a small built-in set is sent.

```javascript
const session = new Session({
  headers: { "User-Agent": "Mozilla/5.0 …", "accept-language": "en-US" },
});
// sends User-Agent, accept-language and authorization
await session.get(url, { headers: { authorization: "Bearer …" } });
// sends User-Agent only
await session.get(url, { headers: { "accept-language": null } });
```

Before 2.2.0 a per-request `headers` object replaced the session headers entirely ([#14](https://github.com/Sahil1337/node-tls-client/issues/14)). To send a request without a session header, set it to `null` as above; to send a bare header set, create the session without `headers`.

## Advanced example

```javascript
const { Session, initTLS, destroyTLS } = require("node-tls-client");

/**
 * @description Demonstrates an advanced usage scenario with the node-tls-client library, showcasing custom TLS client configuration.
 *
 * This example illustrates the creation of a TLS session with tailored settings and the execution of a GET request.
 *
 * Custom TLS settings encompass a wide array of configurations, including:
 * - JA3 string specification
 * - Fine-tuning HTTP/2 settings
 * - Defining supported signature algorithms
 * - Specifying ALPN (Application-Layer Protocol Negotiation) protocols
 * - Declaring supported TLS versions
 * - Setting key share curves for cryptographic key exchange
 * - Choosing a certificate compression algorithm
 * - Configuring connection and header flow parameters
 * - Defining the order of headers and priority frames
 * - Providing default headers for HTTP requests
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions} for more details on session options.
 */

(async () => {
  await initTLS();

  const session = new Session({
    ja3string:
      "771,2570-4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,2570-0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-2570-21,2570-29-23-24,0",
    h2Settings: {
      HEADER_TABLE_SIZE: 65536,
      MAX_CONCURRENT_STREAMS: 1000,
      INITIAL_WINDOW_SIZE: 6291456,
      MAX_HEADER_LIST_SIZE: 262144,
    },
    h2SettingsOrder: [
      "HEADER_TABLE_SIZE",
      "MAX_CONCURRENT_STREAMS",
      "INITIAL_WINDOW_SIZE",
      "MAX_HEADER_LIST_SIZE",
    ],
    supportedSignatureAlgorithms: [
      "ECDSAWithP256AndSHA256",
      "PSSWithSHA256",
      "PKCS1WithSHA256",
      "ECDSAWithP384AndSHA384",
      "PSSWithSHA384",
      "PKCS1WithSHA384",
      "PSSWithSHA512",
      "PKCS1WithSHA512",
    ],
    alpnProtocols: ["h2", "http/1.1"],
    alpsProtocols: ["h2"],
    supportedVersions: ["GREASE", "1.3", "1.2"],
    keyShareCurves: ["GREASE", "X25519"],
    certCompressionAlgos: ["brotli"],
    pseudoHeaderOrder: [":method", ":authority", ":scheme", ":path"],
    connectionFlow: 15663105,
    headerOrder: ["accept", "user-agent", "accept-encoding", "accept-language"],
    priorityFrames: [
      {
        streamID: 1,
        priorityParam: {
          streamDep: 1,
          exclusive: true,
          weight: 1,
        },
      },
    ],
    headerPriority: {
      streamDep: 1,
      exclusive: true,
      weight: 1,
    },
    headers: {
      accept:
        "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const response = await session.get("http://localhost:3000/");
  console.log(response.status, await response.text());
  await session.close();

  await destroyTLS();
})();
```

## More examples

```javascript
const {
  Session,
  ClientIdentifier,
  initTLS,
  destroyTLS,
} = require("node-tls-client");

(async () => {
  await initTLS();

  const session = new Session({
    clientIdentifier: ClientIdentifier.chrome_120, //client identifier
    timeout: 30 * 1000, //timeout in *milliseconds*, applies for each requests, checkout examples/timeout.js for using different timeouts.
    insecureSkipVerify: false,
  });

  const response = await session.get("https://example.com", {
    proxy: `http://user:pass@ip:port`, //proxy format: http://user:pass@ip:port or http://ip:port
    cookies: { parameter: "value" }, //cookies
    followRedirects: true, //follow redirected urls
    headers: { authorization: "test" }, //request headers
  });

  console.log(response.status);

  await session.close();
  await destroyTLS();
})();
//more details: https://sahil1337.github.io/node-tls-client/hierarchy.html#BaseRequestOptions
```

## Session

<div id="session-options">

## Session Options

| Property                                  | Type                                                                                                                  | Description                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `sessionId`                               | string                                                                                                                | A unique identifier for the session.                                                                             |
| `headers`                                 | IncomingHttpHeaders                                                                                                   | An object containing custom headers to send with the request.                                                    |
| `proxy`                                   | string                                                                                                                | A proxy server URL to use for the request. [format: 'http://user:pass@ip:port or http://ip:port']                |
| `isRotatingProxy`                         | boolean                                                                                                               | Whether the proxy is of rotating type or not.                                                                    |
| `clientIdentifier`                        | [ClientIdentifier](https://sahil1337.github.io/node-tls-client/enums/ClientIdentifier.html)                           | A string identifier for the client, e.g., `"chrome_120"`.                                                        |
| `ja3string`                               | string                                                                                                                | A string representing JA3 fingerprinting configuration.                                                          |
| `h2Settings`                              | [h2Settings](https://sahil1337.github.io/node-tls-client/interfaces/H2Settings.html)[]                                | An object specifying HTTP/2 settings.                                                                            |
| `h2SettingsOrder`                         | [h2Settings](https://sahil1337.github.io/node-tls-client/interfaces/H2Settings.html)[]                                | An array specifying the order of HTTP/2 settings.                                                                |
| `supportedSignatureAlgorithms`            | [supportedSignatureAlgorithms](https://sahil1337.github.io/node-tls-client/types/SupportedSignatureAlgorithms.html)[] | An array of supported signature algorithms.                                                                      |
| `supportedVersions`                       | [supportedVersions](https://sahil1337.github.io/node-tls-client/types/SupportedVersions.html)[]                       | An array of supported TLS versions.                                                                              |
| `keyShareCurves`                          | [keyShareCurves](https://sahil1337.github.io/node-tls-client/types/KeyShareCurves.html)[]                             | An array of key share curves.                                                                                    |
| `certCompressionAlgos`                    | [certCompressionAlgo](https://sahil1337.github.io/node-tls-client/types/CertCompressionAlgo.html)[]                   | An array of certificate compression algorithms, e.g., `["brotli"]`.                                              |
| `pseudoHeaderOrder`                       | [pseudoHeaderOrder](https://sahil1337.github.io/node-tls-client/types/PseudoHeaderOrder.html)[]                       | An array specifying the order of pseudo-headers.                                                                 |
| `connectionFlow`                          | number                                                                                                                | A number specifying the connection flow control window size.                                                     |
| `priorityFrames`                          | [priorityFrame](https://sahil1337.github.io/node-tls-client/interfaces/PriorityFrames.html)[]                         | An array of priority frames to send with the request.                                                            |
| `headerOrder`                             | string[]                                                                                                              | An array specifying the order of headers.                                                                        |
| `alpnProtocols`                           | string[]                                                                                                              | An array of Application-Layer Protocol Negotiation (ALPN) protocols.                                             |
| `alpsProtocols`                           | string[]                                                                                                              | An array of Application Layer Protocol Settings (ALPS) protocols.                                                |
| `headerPriority`                          | [priorityParam](https://sahil1337.github.io/node-tls-client/interfaces/PriorityParam.html)                            | An object specifying header priority parameters.                                                                 |
| `randomTlsExtensionOrder`                 | boolean                                                                                                               | A boolean indicating whether to use a random order for TLS extensions.                                           |
| `forceHttp1`                              | boolean                                                                                                               | A boolean indicating whether to force the use of HTTP/1.1.                                                       |
| `debug`                                   | boolean                                                                                                               | A boolean indicating whether to enable debug mode.                                                               |
| `insecureSkipVerify`                      | boolean                                                                                                               | A boolean indicating whether to skip SSL certificate verification.                                               |
| `disableHttp3`                            | boolean                                                                                                               | Disables HTTP/3 (QUIC) for the session.                                                                          |
| `withProtocolRacing`                      | boolean                                                                                                               | Enables protocol racing between HTTP/2 and HTTP/3. Requires a SOCKS5 proxy (or none) since native 1.16.0.        |
| `disableSessionTickets`                   | boolean                                                                                                               | Disables TLS session ticket caching and resumption.                                                              |
| `withoutCookieJar`                        | boolean                                                                                                               | Disables the native session cookie jar, so response cookies are no longer sent on later requests.                |
| `withCustomCookieJar`                     | boolean                                                                                                               | Uses tls-client's custom cookie jar natively instead of Go's default one.                                        |
| `certificatePinningHosts`                 | Record<string, string[]>                                                                                              | Maps a host to an array of pinned certificate fingerprints.                                                      |
| `timeoutSeconds`                          | number                                                                                                                | Request timeout in seconds. Only sent when `timeout` (ms) is unset; setting both keeps `timeout` and warns once. |
| `h3Settings`                              | [H3Settings](https://sahil1337.github.io/node-tls-client/interfaces/H3Settings.html)                                  | HTTP/3 settings (ja3string path only).                                                                           |
| `h3SettingsOrder`                         | (keyof H3Settings)[]                                                                                                  | Order of HTTP/3 settings (ja3string path only).                                                                  |
| `h3PseudoHeaderOrder`                     | [pseudoHeaderOrder](https://sahil1337.github.io/node-tls-client/types/PseudoHeaderOrder.html)[]                       | Order of HTTP/3 pseudo-headers (ja3string path only).                                                            |
| `h3PriorityParam`                         | number                                                                                                                | HTTP/3 priority param (ja3string path only).                                                                     |
| `h3SendGreaseFrames`                      | boolean                                                                                                               | Send HTTP/3 grease frames (ja3string path only).                                                                 |
| `echCandidatePayloads`                    | number[]                                                                                                              | ECH candidate payloads (ja3string path only).                                                                    |
| `echCandidateCipherSuites`                | [CandidateCipherSuite](https://sahil1337.github.io/node-tls-client/interfaces/CandidateCipherSuite.html)[]            | ECH candidate cipher suites (ja3string path only).                                                               |
| `recordSizeLimit`                         | number                                                                                                                | TLS record size limit (ja3string path only).                                                                     |
| `streamId`                                | number                                                                                                                | Stream ID (ja3string path only).                                                                                 |
| `allowHttp`                               | boolean                                                                                                               | Allow plain HTTP (ja3string path only).                                                                          |
| `supportedDelegatedCredentialsAlgorithms` | [supportedSignatureAlgorithms](https://sahil1337.github.io/node-tls-client/types/SupportedSignatureAlgorithms.html)[] | Supported delegated credentials algorithms (ja3string path only).                                                |
| `trustAnchorsPayload`                     | string                                                                                                                | Trust-anchors extension payload; required when the ja3 string lists extension 51764 (ja3string path only).       |

</div>

<div id="session-methods">

## Session methods

| Method                                          | Description                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `get(url: string, options: RequestOptions)`     | Sends a GET request to the specified URL and returns the response.                                |
| `put(url: string, options: RequestOptions)`     | Sends a PUT request to the specified URL with the provided options and returns the response.      |
| `delete(url: string, options: RequestOptions)`  | Sends a DELETE request to the specified URL with the provided options and returns the response.   |
| `options(url: string, options: RequestOptions)` | Sends an OPTIONS request to the specified URL with the provided options and returns the response. |
| `head(url: string, options: RequestOptions)`    | Sends a HEAD request to the specified URL with the provided options and returns the response.     |
| `post(url: string, options: RequestOptions)`    | Sends a POST request to the specified URL with the provided options and returns the response.     |
| `patch(url: string, options: RequestOptions)`   | Sends a PATCH request to the specified URL with the provided options and returns the response.    |
| `close()`                                       | Closes the session.                                                                               |
| `cookies()`                                     | Returns an promise that resolves with an object containing the session cookies.                   |

<div id="request">

## Request Options

| Parameter         | Description                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `body`            | The body of the request: a string, or a `Buffer` (sent base64-encoded as a byte request). Objects throw — `JSON.stringify` them first. |
| `headers`         | An object containing the request headers.                                                                                              |
| `followRedirects` | A boolean value indicating whether to follow redirects.                                                                                |
| `proxy`           | The URL of the proxy server to be used for the request. [format: 'http://user:pass@ip:port or http://ip:port']                         |
| `isRotatingProxy` | Whether the proxy is of rotating type or not.                                                                                          |
| `cookies`         | An object containing cookies to be sent with the request.                                                                              |

</div>

<div id="response">

## Response

| Properties | Description                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ok`       | This boolean value indicates whether the request was successful or not. It returns "true" if the response status is within the range 200-299, indicating success. Otherwise, it returns "false".` |
| `headers`  | This object contains the response headers returned by the server.                                                                                                                                 |
| `status`   | This integer represents the HTTP status code of the response.                                                                                                                                     |
| `url`      | This is the URL to which the request was made.                                                                                                                                                    |
| `cookies`  | Returns an object containing the cookies for that URL.                                                                                                                                            |

| Methods  | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `text()` | Returns a promise that resolves with the response body as plain text.  |
| `json()` | Returns a promise that resolves with the response body parsed as JSON. |

</div>

## Acknowledgements

This library is based on [bogdanfinn's](https://github.com/bogdanfinn) tls client in golang. A big thanks to him.
