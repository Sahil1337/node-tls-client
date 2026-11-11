# 2.2.1 (November 12, 2026)

> [!IMPORTANT]
> **Behavior changes:** upgrading downloads the native library again (the cached copy is named after the package version), and the newest is now tls-client 1.18.1, for both binaries. Previously the default binary was 1.16.0 and `binary: "node-tls-client"` was 1.18.0. What you'll notice:
>
> - **The default profile's fingerprint changes.** `chrome_150` and `chrome_150_psk` now send the trust-anchors extension (51764), as Chrome 150 does. JA4 goes from `t13d1516h2_8daaf6152771_806a8c22fdea` to `t13d1517h2_8daaf6152771_cb7bf5808d99`, the same as `chrome_152`.
> - **Characters a URL can't carry raw are percent-encoded in query strings**, as browsers do: `?scope=openid offline_access` is sent as `?scope=openid%20offline_access`. Before, they were sent raw, and servers usually answered 400.
> - With the default binary, `disableSessionTickets` and `trustAnchorsPayload` now take effect; 1.16.0 ignored them.

### Additions

- **New client profiles:** `chrome_154`, `chrome_154_psk` and `safari_27_2` (desktop Safari 27.2). `chrome_154(_psk)` is `chrome_152(_psk)` with the trust-anchors extension sorted, as Chrome 154 and later send it, so its bytes no longer change from one process to the next; pair it with a current Chrome `User-Agent`. A native library older than 1.18.1 doesn't know these names and uses its default profile (`chrome_150`) instead, without an error. This can happen when `initTLS()` warns that it's using a previously cached library.

# 2.2.0 (November 5, 2026)

> [!IMPORTANT]
> **Behavior changes** (no API removals):
>
> - **New `binary` option for the native library.** The default is unchanged: `"upstream"`, tls-client's official release. `binary: "node-tls-client"` opts into [our build](https://sahil1337.github.io/node-tls-client/guides/node-tls-client-binary), which runs requests differently: every request you start runs at once instead of waiting for a free thread, so memory grows with requests in flight, `UV_THREADPOOL_SIZE` no longer limits them, and `concurrency` is ignored with a warning. It is built from tls-client 1.18.0 (the official release is 1.16.0) and runs this way on the main thread only: in a worker thread, or when our build isn't available for your platform or can't be downloaded, `initTLS()` warns and uses the official binary.
> - **Requests run on Node's libuv threadpool** instead of 2.1.0's worker threads. Importing the package sets `UV_THREADPOOL_SIZE` to CPU cores × 2 when it's unset, which also sizes the pool your own `fs`, `dns` and `crypto` calls use; set it yourself to choose the size. See [Concurrency](https://sahil1337.github.io/node-tls-client/guides/concurrency).
> - **Default client profile is now `chrome_150`** (previously `chrome_131`), matching native's default. Applies only to sessions with no explicit `clientIdentifier` or `ja3string`. Pin `clientIdentifier: ClientIdentifier.chrome_131` to keep the old fingerprint.
> - **Per-request `headers` now merge over session `headers`** ([#14](https://github.com/Sahil1337/node-tls-client/issues/14)): case-insensitive, the request's value and casing win, `null`/`undefined` removes a session header. Previously any per-request `headers` object replaced the whole session set — silently dropping the session `User-Agent`, so native sent `Go-http-client/1.1`. This matches axios, got and Python requests; to send a request without a session header, set that key to `null`.
> - **`connectHeaders`**: the request-level value now wins over the session-level one (previously inverted).
> - **`body`** must be a string or `Buffer`/`Uint8Array` (sent base64-encoded as a byte request). Objects now throw `TlsClientError` instead of failing natively with `status: 0`.
> - **Idle connections:** a session now keeps up to 256 idle HTTP/1.1 connections per host, as Node's `http.Agent` (and so node-fetch) does. Native's previous default of 2 made parallel requests to one host open and close a connection each, which could run out of local ports (`EADDRNOTAVAIL`). Set `transportOptions.maxIdleConnsPerHost` to change it (`0` restores the old default).

### Performance

Medians of three runs on an Apple M5 (10 cores) with Node.js 26.7.0, against a local server that answers in 50 ms. Charts, all results and the method are on the [Performance](https://sahil1337.github.io/node-tls-client/performance) page; the harness is in [`bench/`](https://github.com/Sahil1337/node-tls-client/tree/main/bench).

|                                                |   2.1.0 |   2.2.0 | 2.2.0 + `binary: "node-tls-client"` | node-fetch 2.7.0 |
| ---------------------------------------------- | ------: | ------: | ----------------------------------: | ---------------: |
| 64 in flight: requests/s                       |     377 |     385 |                               1,207 |            1,228 |
| 1,024 in flight: requests/s                    |     383 |     384 |                              15,432 |           14,339 |
| 5,000 at once: time to finish                  |  13.1 s |  13.0 s |                              0.26 s |           0.43 s |
| 2,000 HTTPS (HTTP/1.1) at once: time to finish |  5.21 s |  5.20 s |                              0.47 s |         8.08 s ¹ |
| 2,000 HTTPS (HTTP/2) at once: time to finish   |  5.26 s |  5.21 s |                              0.10 s |    not supported |
| 16 in flight: CPU per request                  | 9.83 ms | 0.56 ms |                             0.50 ms |          0.42 ms |
| 64 in flight: CPU per request                  | 1.33 ms | 0.49 ms |                             0.31 ms |          0.23 ms |
| 64 in flight: peak memory                      |  372 MB |   86 MB |                               89 MB |            84 MB |

¹ node-fetch lost connections in two of three runs (401 of 6,000 requests failed with `ETIMEDOUT`): the test server's queue of waiting connections holds 128 on macOS by default. Its clean run took 0.8 s.

2.1.0 and 2.2.0 run CPU cores × 2 requests at once (20 here), which caps them near 385 requests/s against this server; 2.2.0 can go higher with `UV_THREADPOOL_SIZE`. The node-tls-client binary has no such cap.

### Transport rewrite

- **Piscina worker pool removed** ([#11](https://github.com/Sahil1337/node-tls-client/issues/11)). Native calls now use koffi's asynchronous calls on the libuv threadpool, throttled by an in-process semaphore, with an unbounded FIFO queue for bursts. This avoids the `max_async_calls` limit that broke the first attempt: koffi ≥ 2.15.2 is required and its limit is raised to 4096.
- **Dependencies:** `piscina` and `cookie-parser` are no longer installed; the runtime dependencies are `koffi` (≥ 2.15.2) and `tough-cookie`.
- **`initTLS({ concurrency })`** caps in-flight native calls (admission depth). Real parallelism is the libuv threadpool: the library sets `UV_THREADPOOL_SIZE` to cores×2 at import when unset (libuv caps it at 1024; set `UV_THREADPOOL_SIZE=4` to keep Node's default). Each in-flight call reserves ~256 KiB in koffi.
- **The `UV_THREADPOOL_SIZE` default does not apply to an ES module entry file on Node 20, Node 22 before 22.18 and Node 24 before 24.3**: Node starts its threadpool before this package loads, so at most 4 requests run in parallel. A one-time warning from `initTLS()` says so (not with `binary: "node-tls-client"`, which doesn't use the threadpool for requests); set `UV_THREADPOOL_SIZE` in the environment (`UV_THREADPOOL_SIZE=20 node app.mjs`) there. CommonJS entry files and newer Node versions are unaffected.
- `destroyTLS()` rejects new requests, waits for in-flight ones (each bounded by its own timeout), then clears native state.
- koffi keeps as many async memory pools resident as requests are expected in flight (up to its maximum of 16), so steady-state requests reuse pools instead of mapping 256 KiB each.

### Additions

- **Faster native binary, opt-in:** `initTLS({ binary: "node-tls-client" })` downloads our build of tls-client ([Sahil1337/tls-client](https://github.com/Sahil1337/tls-client)), made from upstream's newest version tag, so `disableSessionTickets` and `trustAnchorsPayload` work with it. It adds a completion queue: a request no longer holds a thread while it waits for the server, and the library calls back when responses arrive. Against a server that answers in 50 ms, 5,000 requests at once finish in 0.26 s instead of 13.0 s, and 64 at a time reach 1,207 requests/s instead of 385 (node-fetch: 1,228); see [Performance](#performance). Memory peaks at 349 MB with 5,000 at once (node-fetch: 278 MB); as with node-fetch there is no built-in cap, so limit requests in flight in your own code if memory matters.
- **New client profiles:** `chrome_130_psk`, `chrome_133(_psk)`, `chrome_144(_psk)`, `chrome_146(_psk)`, `chrome_150(_psk)`, `chrome_152(_psk)`, `brave_146(_psk)`, `safari_ios_18_5`, `safari_ios_26_0`, `firefox_135`, `firefox_146_psk`, `firefox_147(_psk)`, `firefox_148`.
- **New SessionOptions:** `disableHttp3`, `withProtocolRacing`, `withoutCookieJar`, `withCustomCookieJar`, `certificatePinningHosts`, `timeoutSeconds`, `disableSessionTickets`.
- **New custom-client (ja3string) options:** `h3Settings`, `h3SettingsOrder`, `h3PseudoHeaderOrder`, `h3PriorityParam`, `h3SendGreaseFrames`, `echCandidatePayloads`, `echCandidateCipherSuites`, `recordSizeLimit`, `streamId`, `allowHttp`, `supportedDelegatedCredentialsAlgorithms`, `trustAnchorsPayload` (required when the ja3 string lists extension 51764).
- **New enum values:** `KeyShareCurves` gains `X25519Kyber768Old`, `X25519MLKEM768`; `SupportedSignatureAlgorithms` gains `SHA224_RSA`, `SHA224_ECDSA`, `MLDSA44`, `MLDSA65`, `MLDSA87`, `GREASE`.
- **Custom install directory for the native library:** `initTLS({ libraryDir: "./vendor/tls" })` downloads the shared library to, and loads it from, that directory instead of `os.tmpdir()`. The directory is created when missing and relative paths resolve against the current working directory. Use it to install the binary ahead of time (e.g. in a Docker build step) or to copy it onto an offline machine. Leaving it out keeps the `os.tmpdir()` default used since 1.1.1.
- **`TlsClientError` is exported from the package root**, so the library's own errors (e.g. from `initTLS()`, or anything `fetch()` rejects with) can be checked with `instanceof`. The deep import `node-tls-client/dist/utils/tlsError` keeps working.
- `HeaderInput` type for all `headers` options (numbers, arrays and `null` accepted).
- Linux ppc64le, s390x and riscv64 are supported.
- **HTTP/3 guide:** [HTTP/3](https://sahil1337.github.io/node-tls-client/guides/http3) (example: [examples/advanced/http3.mjs](https://github.com/Sahil1337/node-tls-client/tree/main/examples/advanced/http3.mjs))
- **New documentation site:** [sahil1337.github.io/node-tls-client](https://sahil1337.github.io/node-tls-client/), with a guide per feature and runnable examples in `examples/`. Old API reference URLs redirect to the new pages; the readme is now a short intro.

### Deprecations

- **`certCompressionAlgo` (string) → `certCompressionAlgos` (array).** The old singular key still works (wrapped into an array) but will be removed in a future major. Default remains `["zlib"]`.
- `IClient` type → use `TlsNativeLibrary` (the bindings are now promise-returning).

### Fixes

- **A failed native download no longer exits or crashes the process** ([#16](https://github.com/Sahil1337/node-tls-client/issues/16)). `initTLS()` now throws a `TlsClientError` instead of calling `process.exit(1)`, a TLS error during the download (e.g. `ERR_SSL_PACKET_LENGTH_TOO_LONG`) rejects `initTLS()` instead of surfacing as an uncaught exception, and a stalled download fails after 30 s instead of hanging.
- **The native download handles both upstream asset naming schemes.** tls-client 1.16.0 was briefly published with only renamed assets (`tls-client-xgo-<version>-<os>-<arch>`, September 2–7, 2026), which made fresh 2.1.0 installs exit during `initTLS()`.
- **The cached native binary refreshes on upgrade**, so new profiles and options work right after updating. If that download fails, a previously cached binary is used with a warning.
- **Memory leak on `session.close()` / `fetch()`:** native memory for each closed session was never freed.
- `timeout` and `timeoutSeconds` together were a hard native error; the wrapper now sends only `timeout` (ms) and warns once. `timeout: 0` means unset.
- `headerPriority: null` omits the field on the ja3 path (native then applies no priority); leaving it unset still sends the zeroed priority earlier versions sent.
- `H2Settings.ENABLE_PUSH` set to a boolean, as 2.1.0 typed it, failed every request natively (`status: 0`, "cannot unmarshal bool"); booleans are now sent as `1`/`0`, and numbers are accepted too. `headerOrder` accepts `string[]`.
- `SessionOptions.sessionId` is honored (it was documented but always replaced by a random UUID); two `Session` objects with the same id share one native session.
- Per-request `cookies` values are sent verbatim; a value containing `;` was previously cut at the semicolon.
- A response cookie that cannot be parsed no longer fails an otherwise successful request.
- `H2Settings` accepts `UNKNOWN_SETTING_7`, `UNKNOWN_SETTING_8` and `UNKNOWN_SETTING_9`, and every `TransportOptions` field is optional (native treats a missing field as its default).

### Notes

- Cookies are kept between requests by the native session jar (`withoutCookieJar` turns it off); `session.cookies()` reports the cookies the session has seen.
- `withProtocolRacing` with a non-SOCKS5 proxy is rejected by native 1.16.0 (`status: 0`).
- `disableSessionTickets` and `trustAnchorsPayload` need a tls-client build newer than the 1.16.0 release binaries, which predate those fields and silently ignore them.
- Alpine (musl) is not supported yet: upstream only publishes an amd64 Alpine build, and this version does not download it. Use a glibc-based image such as `node:<version>-slim`.
- HTTP/3 known issues (native 1.16.0, protocol racing only): only `chrome_144(_psk)`, `firefox_147(_psk)` and `firefox_148` carry real HTTP/3 settings, and heavy concurrent racing can crash the process. Use `disableHttp3: true` for volume.
- With upstream's binary, native calls share the libuv threadpool with Node's `fs`/DNS/zlib/crypto work; size `UV_THREADPOOL_SIZE` for both.
- Requires Node.js ≥ 20.
- `initTLS()` downloads the newest upstream release into `os.tmpdir()` (or `libraryDir`) on first use and after a wrapper upgrade. Response `headers` values are `string[]` at runtime.
- The internal file layout changed (`dist/lib`, `dist/interface` and `dist/workers` are gone). Import from the package root, which exports the whole public API. Deep imports into `dist/` were never part of the API; `dist/utils/tlsError` is kept for existing `instanceof` checks.

# 2.1.0 (June 21, 2025)

> [!WARNING]  
> This version contains breaking changes.

### Breaking changes

- **TLS Client Initialization Requirement**  
  The new method `initTLS()` **must be called before** using any session methods.  
  You must also call `destroyTLS()` when the session is no longer needed.
- **Refactor Cookies API**  
  `<session>.cookies` is no longer a synchronous getter.  
  It now returns a `Promise` that resolves to a cookie object.  
  Usage: [Cookies](https://sahil1337.github.io/node-tls-client/guides/cookies)
- **Redirect Handling Change**  
  The `redirect` option in `requestOptions` is no longer supported. Use `followRedirects` instead.

### Additions/Fixes

- **Node.js Compatibility Fix**  
  The `process.clearLine()` bug has been resolved. Fixed issues [#2](https://github.com/Sahil1337/node-tls-client/issues/2) , [#3](https://github.com/Sahil1337/node-tls-client/issues/3) , [#6](https://github.com/Sahil1337/node-tls-client/issues/6)

- **Shared Worker Pool (Performance Improvement)**  
  A centralized shared worker pool has been introduced, leading to major performance gains across concurrent TLS sessions.

  Proof of concept:

  ![Performance Benchmark](https://media.discordapp.net/attachments/1358096526018220182/1358098103701340231/Node-Tls-Client-2025-04-05-151641.png?ex=68581e6c&is=6856ccec&hm=bbb07fe5910116c1f4f7f1f1f3b3d6a5e502e5788ea1bf0438cbf533ceb77b11&=&format=webp&quality=lossless&width=653&height=803)

- **New: `transportOptions` in SessionOptions**  
  Introduced `transportOptions` to customize low-level transport configuration.  
  [Docs → transportOptions](https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html#transportOptions)

- **Additional Session Options Introduced**  
  The following options provide extended control over stream output:
  - `serverNameOverwrite`
  - `streamOutputBlockSize`
  - `streamOutputEOFSymbol`
  - `streamOutputPath`  
    [Docs → SessionOptions](https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions)

- **Enhanced Documentation**  
  Executable compatibility instructions and examples have been added to the documentation. [Instructions](https://sahil1337.github.io/node-tls-client/guides/bundling)

- **Refactor byteRequest handling**
  Taking into account the `Content-Encoding` and `Content-Transfer-Encoding` headers to determine if the response is a byte response. [Accounting for pull request #8](https://github.com/Sahil1337/node-tls-client/pull/8)

# 2.0.0 (December 15, 2024)

> [!WARNING]  
> This version contains breaking changes.

- Call `<session>.init()` after setting up a session and before using any HTTP methods. (See the documentation for more details.)
- Resolved memory leak issues by moving to workerpool.
- Added new profiles: `chrome_131`, `chrome_131_psk`, `firefox_132`, `firefox_133`, and `ios_safari_18`. The default profile is now `chrome_131` (previously `chrome_124`).
- Introduced the `isRotatingProxy` option for handling rotating proxies. PS: [SessionOptions](https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html)

# 1.1.4 (July 29, 2024)

> [!IMPORTANT]
> This version includes significant updates and improvements.

### Breaking changes

- `response.cookies` is now a property instead of a method. [Note: `response.cookies()` has been removed and replaced with `response.cookies`.]

### Additional updates

- Added `session.cookies` property to retrieve all session cookies. For detailed information, see [Cookies](https://sahil1337.github.io/node-tls-client/guides/cookies).
- Added `byteResponse` option in requestOptions. Setting this to true ensures that the response is treated as a byte response. For detailed information, see [Responses → Binary downloads](https://sahil1337.github.io/node-tls-client/guides/responses#binary-downloads)
- Added functionality to send binary data. Note: Ensure that the appropriate headers are set before sending binary data in the body.
- Added `disableIPV6` and `disableIPV4` options in `SessionOptions`. For detailed information, see [SessionOptions](https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html#disableIPV4)
- Added `hostOverride` property in requestOptions. Used to override the Host header, typically needed when making requests directly to an IP address.
- `chrome_124` profile will be used when no `client_identifier` is specified in session options.
- Refactored cookies.ts and session typings for improved readability (internal change, no impact on existing use cases)
- Updated TlsResponse according to new changes.

# 1.1.3 (June 13, 2024)

> [!WARNING]  
> This version contains breaking changes.

### Breaking changes

- `response.json()` and `response.text()` methods now return a `Promise`.
- `response.cookies()` now returns an object of cookies instead of a`Promise`.
- `session.methods` no longer include the `timeout` and `rejectUnauthorized` options. Since timeout cannot be changed during a session, ensure to specify `timeout` & `rejectUnauthorized` in SessionOptions when creating a session.

### Additions

- `fetch(fetchOptions)` method have been added to use different timeouts & rejectUnauthorized values in each request. See [fetch()](https://sahil1337.github.io/node-tls-client/reference/fetch) for more information.

### Fixes

- Fixed a typo that prevented timeout from working correctly.

# 1.1.2 (June 9, 2024)

### Additions

- Introduced client profile types.

### Changes

- Enhanced documentation for improved clarity and usability.
- Updated the README with minor adjustments.
- Refined interface definitions for better readability and understanding.

# 1.1.1 (June 4 2024)

### Additions

- Implemented dynamic methods for downloading shared files in "node-tls-client", eliminating the inclusion of prebuilt files.

### Changes

- Path used for storing the shared library files is strictly set to tmpdir path.

### Benefits

- Reduces package size.
- Ensures better support for executables.

# 1.1.0 (June 3, 2024)

### Changes

- Improved handling of shared library files:
  - Only the shared library file matching the current operating system is preserved. All other shared library files are deleted.
- Added support for executables.
