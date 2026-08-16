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

## Backends

`initTLS({ mode })` selects how requests are transported. Everything above the transport — `Session`, request methods, options, responses — is identical no matter which backend you pick, so you can switch modes without touching request code.

| | **`ffi`** (default) | **`server`** |
| --- | --- | --- |
| How | Native binary loaded in-process via [koffi](https://github.com/Koromix/koffi) | Thin HTTP client to an external [`tls-client-api`](https://github.com/bogdanfinn/tls-client-api) URL |
| Infra | None — binary auto-downloaded on first `initTLS()` | You run one or more `tls-client-api` processes |
| Parallelism | Thread-bound (`UV_THREADPOOL_SIZE`) — see [Concurrency](#concurrency--scaling) | Goroutines + netpoller — thousands per process |
| Best for | Most apps, scripts, moderate concurrency | High concurrency, multi-machine behind a load balancer |

<details open>
<summary><b>FFI mode</b> — default, zero infra</summary>

```javascript
const { Session, initTLS, destroyTLS } = require("node-tls-client");

(async () => {
  await initTLS(); // mode defaults to "ffi"; binary downloaded once
  // await initTLS({ concurrency: 64 }); // optional — see Concurrency below

  const session = new Session({ timeout: 30000 });
  const res = await session.get("https://example.com");
  console.log(res.status);

  await session.close();
  await destroyTLS();
})();
```
</details>

<details>
<summary><b>Server mode</b> — external <code>tls-client-api</code> URL or load balancer</summary>

Point `server.url` at a running [`tls-client-api`](https://github.com/bogdanfinn/tls-client-api) instance (or an LB in front of many). No binary is downloaded in this mode.

```javascript
const { Session, initTLS, destroyTLS } = require("node-tls-client");

(async () => {
  await initTLS({
    mode: "server",
    server: {
      url: "http://127.0.0.1:8080", // or your load balancer
      apiKey: "your-api-key",       // sent as the X-API-KEY header
    },
    concurrency: 256,               // http keep-alive Agent maxSockets
  });

  const session = new Session({ timeout: 30000 });
  const res = await session.get("https://example.com");
  console.log(res.status);

  await session.close();
  await destroyTLS();
})();
```
</details>

### `initTLS(options?)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `"ffi"` \| `"server"` | `"ffi"` | Transport backend. |
| `concurrency` | `number` | ffi: `UV_THREADPOOL_SIZE` (or cores×2) · server: `256` | ffi → semaphore admission depth (see below). server → http Agent `maxSockets`. |
| `server.url` | `string` | — | **Required** when `mode: "server"`. Points at one instance or a load balancer. |
| `server.apiKey` | `string` | — | Sent as the `X-API-KEY` header. |

`initTLS()` with no arguments behaves exactly as before — nothing to change for existing code.

## Concurrency & scaling

The native FFI request is a **blocking call**: each in-flight request holds one libuv threadpool thread for its full round-trip. So in FFI mode:

- **`concurrency` caps admission / burst-queue depth, not parallelism.** Real parallelism = `UV_THREADPOOL_SIZE`, fixed at process start. `initTLS({ concurrency: 200 })` admits 200, but only `UV_THREADPOOL_SIZE` run at once; the rest queue. It's clamped to koffi's hard max of `4096`.
- **To raise real parallelism, set `UV_THREADPOOL_SIZE` in the environment** *before* Node starts (the library defaults it to `cores×2` if unset):

  ```sh
  UV_THREADPOOL_SIZE=64 node app.js
  ```
- For true high concurrency, prefer **server mode** — the Go server uses goroutines + a netpoller (non-blocking), so a single process saturates all cores and handles thousands of concurrent requests.

| Need | Answer | Library work |
| --- | --- | --- |
| High concurrency, one machine | Server mode → one `tls-client-api` process (or FFI + raised `UV_THREADPOOL_SIZE`) | run one process |
| Multi-machine / true cluster | Run N `tls-client-api` containers behind a load balancer; point `server.url` at the LB | zero — external url already covers it |

> A single `tls-client-api` process handles thousands of concurrent requests across all CPU cores; you rarely need more than one per machine.

<details>
<summary>Multi-machine: docker-compose + nginx snippet</summary>

```yaml
# docker-compose.yml — N tls-client-api replicas behind nginx
services:
  tls-api:
    image: ghcr.io/bogdanfinn/tls-client-api:latest
    environment:
      - API_AUTH_KEYS=your-api-key
    deploy:
      replicas: 4
  nginx:
    image: nginx:alpine
    ports: ["8080:8080"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]
    depends_on: [tls-api]
```

```nginx
# nginx.conf
events {}
http {
  upstream tls_api { server tls-api:8080; }
  server {
    listen 8080;
    location / { proxy_pass http://tls_api; }
  }
}
```

Then: `initTLS({ mode: "server", server: { url: "http://your-lb:8080", apiKey: "your-api-key" } })`.
</details>

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
const { Session, ClientIdentifier, initTLS, destroyTLS } = require("node-tls-client");

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

| Property                       | Type                                                                                                                                    | Description                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `sessionId`                    | string                                                                                                                                  | A unique identifier for the session.                                   |
| `headers`                      | IncomingHttpHeaders                                                                                                                     | An object containing custom headers to send with the request.          |
| `proxy`                        | string                                                                                                                                  | A proxy server URL to use for the request. [format: 'http://user:pass@ip:port or http://ip:port']
| `isRotatingProxy`                        | boolean                                                                                                                                  | Whether the proxy is of rotating type or not.                      |
| `clientIdentifier`             | [ClientIdentifier](https://sahil1337.github.io/node-tls-client/enums/ClientIdentifier.html)                                                                                                                                  | A string identifier for the client, e.g., `"chrome_120"`.              |
| `ja3string`                    | string                                                                                                                                  | A string representing JA3 fingerprinting configuration.                |
| `h2Settings`                   | [h2Settings](https://sahil1337.github.io/node-tls-client/interfaces/H2Settings.html)[]                                       | An object specifying HTTP/2 settings.                                  |
| `h2SettingsOrder`              | [h2Settings](https://sahil1337.github.io/node-tls-client/interfaces/H2Settings.html)[]                                       | An array specifying the order of HTTP/2 settings.                      |
| `supportedSignatureAlgorithms` | [supportedSignatureAlgorithms](https://sahil1337.github.io/node-tls-client/types/SupportedSignatureAlgorithms.html)[] | An array of supported signature algorithms.                            |
| `supportedVersions`            | [supportedVersions](https://sahil1337.github.io/node-tls-client/types/SupportedVersions.html)[]                        | An array of supported TLS versions.                                    |
| `keyShareCurves`               | [keyShareCurves](https://sahil1337.github.io/node-tls-client/types/KeyShareCurves.html)[]                               | An array of key share curves.                                          |
| `certCompressionAlgos`         | [certCompressionAlgo](https://sahil1337.github.io/node-tls-client/types/CertCompressionAlgo.html)[]                | An array of certificate compression algorithms, e.g., `["brotli"]`.    |
| `pseudoHeaderOrder`            | [pseudoHeaderOrder](https://sahil1337.github.io/node-tls-client/types/PseudoHeaderOrder.html)[]                                                                                                                     | An array specifying the order of pseudo-headers.                       |
| `connectionFlow`               | number                                                                                                                                  | A number specifying the connection flow control window size.           |
| `priorityFrames`               | [priorityFrame](https://sahil1337.github.io/node-tls-client/interfaces/PriorityFrames.html)[]                                | An array of priority frames to send with the request.                  |
| `headerOrder`                  | string[]                                                                                                                                | An array specifying the order of headers.                              |
| `alpnProtocols`                | string[]                                                                                                                                | An array of Application-Layer Protocol Negotiation (ALPN) protocols.   |
| `alpsProtocols`                | string[]                                                                                                                                | An array of Application Layer Protocol Settings (ALPS) protocols.      |
| `headerPriority`               | [priorityParam](https://sahil1337.github.io/node-tls-client/interfaces/PriorityParam.html)                                   | An object specifying header priority parameters.                       |
| `randomTlsExtensionOrder`      | boolean                                                                                                                                 | A boolean indicating whether to use a random order for TLS extensions. |
| `forceHttp1`                   | boolean                                                                                                                                 | A boolean indicating whether to force the use of HTTP/1.1.             |
| `debug`                        | boolean                                                                                                                                 | A boolean indicating whether to enable debug mode.                     |
| `insecureSkipVerify`           | boolean                                                                                                                                 | A boolean indicating whether to skip SSL certificate verification.     |
| `disableHttp3`                 | boolean                                                                                                                                 | Disables HTTP/3 (QUIC) for the session.                                |
| `withProtocolRacing`           | boolean                                                                                                                                 | Enables protocol racing between HTTP/2 and HTTP/3.                     |
| `withoutCookieJar`             | boolean                                                                                                                                 | Disables native's per-request cookie jar. (The wrapper's own JS cookie jar stays active regardless.) |
| `withCustomCookieJar`          | boolean                                                                                                                                 | Uses a custom native cookie jar. (The wrapper's own JS cookie jar stays active regardless.)          |
| `certificatePinningHosts`      | Record<string, string[]>                                                                                                                | Maps a host to an array of pinned certificate fingerprints.            |
| `defaultHeaders`               | Record<string, string[]>                                                                                                                | Fallback headers, applied natively only for headers not already set (largely inert since the wrapper always sends a full header map). |
| `timeoutSeconds`               | number                                                                                                                                  | Request timeout in seconds. Prefer `timeout` (ms), which takes precedence natively — do not set both. |
| `h3Settings`                   | [H3Settings](https://sahil1337.github.io/node-tls-client/interfaces/H3Settings.html)                                                    | HTTP/3 settings (ja3string path only).                                 |
| `h3SettingsOrder`              | (keyof H3Settings)[]                                                                                                                     | Order of HTTP/3 settings (ja3string path only).                        |
| `h3PseudoHeaderOrder`          | [pseudoHeaderOrder](https://sahil1337.github.io/node-tls-client/types/PseudoHeaderOrder.html)[]                                          | Order of HTTP/3 pseudo-headers (ja3string path only).                  |
| `h3PriorityParam`              | number                                                                                                                                  | HTTP/3 priority param (ja3string path only).                           |
| `h3SendGreaseFrames`           | boolean                                                                                                                                 | Send HTTP/3 grease frames (ja3string path only).                       |
| `echCandidatePayloads`         | number[]                                                                                                                                | ECH candidate payloads (ja3string path only).                          |
| `echCandidateCipherSuites`     | [CandidateCipherSuite](https://sahil1337.github.io/node-tls-client/interfaces/CandidateCipherSuite.html)[]                              | ECH candidate cipher suites (ja3string path only).                     |
| `recordSizeLimit`              | number                                                                                                                                  | TLS record size limit (ja3string path only).                          |
| `streamId`                     | number                                                                                                                                  | Stream ID (ja3string path only).                                       |
| `allowHttp`                    | boolean                                                                                                                                 | Allow plain HTTP (ja3string path only).                                |
| `supportedDelegatedCredentialsAlgorithms` | [supportedSignatureAlgorithms](https://sahil1337.github.io/node-tls-client/types/SupportedSignatureAlgorithms.html)[]         | Supported delegated credentials algorithms (ja3string path only).      |

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
| `cookies()`                                       | Returns an promise that resolves with an object containing the session cookies.                                                 |

<div id="request">

## Request Options

| Parameter            | Description                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `body`               | The body of the request, if applicable. This can be a string, a buffer, or an object.           |
| `headers`            | An object containing the request headers.                                                       |
| `followRedirects`           | A boolean value indicating whether to follow redirects.                                         |
| `additionalDecode`   | A boolean value indicating whether to perform additional decoding of the response content.      |
| `proxy`              | The URL of the proxy server to be used for the request. [format: 'http://user:pass@ip:port or http://ip:port']                                                                                                                |
| `isRotatingProxy`                        |  Whether the proxy is of rotating type or not.                      |
| `cookies`            | An object containing cookies to be sent with the request.                                       |

</div>

<div id="response">

## Response

| Properties | Description                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ok`       | This boolean value indicates whether the request was successful or not. It returns "true" if the response status is within the range 200-299, indicating success. Otherwise, it returns "false".` |
| `headers`  | This object contains the response headers returned by the server.                                                                                                                                 |
| `status`   | This integer represents the HTTP status code of the response.                                                                                                                                     |
| `url`      | This is the URL to which the request was made.                                                                                                                                                    |
| `cookies`   | Returns an object containing the cookies for that URL.    

| Methods     | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| `text()`    | Returns a promise that resolves with the response body as plain text.                                            |
| `json()`    | Returns a promise that resolves with the response body parsed as JSON.                                           |

</div>



## Acknowledgements
This library is based on [bogdanfinn's](https://github.com/bogdanfinn) tls client in golang. A big thanks to him.
