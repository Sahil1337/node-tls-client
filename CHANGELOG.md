# 2.2.0 (unreleased)

Tested against the native shared library **v1.16.0**.

> [!IMPORTANT]
> **Behavior changes** (no API removals):
>
> - **Default client profile is now `chrome_150`** (previously `chrome_131`), matching native's default. Applies only to sessions with no explicit `clientIdentifier` or `ja3string`. Pin `clientIdentifier: ClientIdentifier.chrome_131` to keep the old fingerprint.
> - **Per-request `headers` now merge over session `headers`** (case-insensitive, the request's value and casing win, `null`/`undefined` removes a session header). Previously any per-request header replaced the whole session set — silently dropping the session `User-Agent`, so native sent `Go-http-client/1.1`. Set `headerMode: "replace"` on the session to keep the old behavior.
> - **`connectHeaders`**: the request-level value now wins over the session-level one (previously inverted).
> - **`body`** must be a string or `Buffer`/`Uint8Array` (sent base64-encoded as a byte request). Objects now throw `TlsClientError` instead of failing natively with `status: 0`.

### Additions

- **New client profiles:** `chrome_130_psk`, `chrome_133(_psk)`, `chrome_144(_psk)`, `chrome_146(_psk)`, `chrome_150(_psk)`, `chrome_152(_psk)`, `brave_146(_psk)`, `safari_ios_18_5`, `safari_ios_26_0`, `firefox_135`, `firefox_146_psk`, `firefox_147(_psk)`, `firefox_148`.
- **New SessionOptions:** `headerMode`, `disableHttp3`, `withProtocolRacing`, `withoutCookieJar`, `withCustomCookieJar`, `certificatePinningHosts`, `timeoutSeconds`, `disableSessionTickets`.
- **New custom-client (ja3string) options:** `h3Settings`, `h3SettingsOrder`, `h3PseudoHeaderOrder`, `h3PriorityParam`, `h3SendGreaseFrames`, `echCandidatePayloads`, `echCandidateCipherSuites`, `recordSizeLimit`, `streamId`, `allowHttp`, `supportedDelegatedCredentialsAlgorithms`, `trustAnchorsPayload` (required when the ja3 string lists extension 51764).
- **New enum values:** `KeyShareCurves` gains `X25519Kyber768Old`, `X25519MLKEM768`; `SupportedSignatureAlgorithms` gains `SHA224_RSA`, `SHA224_ECDSA`, `MLDSA44`, `MLDSA65`, `MLDSA87`, `GREASE`.
- **`initTLS({ concurrency })`** limits how many requests run natively at once. Default: the libuv threadpool size.
- `HeaderInput` type for all `headers` options (numbers, arrays and `null` accepted).
- Linux ppc64le, s390x and riscv64 are supported.
- **HTTP/3 example:** [examples/http3.js](https://github.com/Sahil1337/node-tls-client/tree/main/examples/http3.js)

### Changes

- Importing the library sets `UV_THREADPOOL_SIZE` to cores×2 when it is unset. The threadpool is shared with Node's `fs`/DNS/zlib/crypto work; set `UV_THREADPOOL_SIZE` yourself to choose another size (`4` is Node's default).
- `destroyTLS()` waits for in-flight requests to finish; requests made after it is called are rejected.
- Requires Node.js ≥ 20.

### Deprecations

- **`certCompressionAlgo` (string) → `certCompressionAlgos` (array).** The old singular key still works (wrapped into an array) but will be removed in a future major. Default remains `["zlib"]`.
- `IClient` type → use `TlsNativeLibrary` (the bindings are now promise-returning).

### Fixes

- **A failed native download no longer exits the process.** `initTLS()` now throws a `TlsClientError` instead of calling `process.exit(1)`, and a stalled download fails after 30 s instead of hanging.
- **The native download handles both upstream asset naming schemes.** tls-client 1.16.0 was briefly published with only renamed assets (`tls-client-xgo-<version>-<os>-<arch>`, September 2–7, 2026), which made fresh 2.1.0 installs exit during `initTLS()`.
- **The cached native binary refreshes on upgrade**, so new profiles and options work right after updating. If that download fails, a previously cached binary is used with a warning.
- **Memory leak on `session.close()` / `fetch()`:** native memory for each closed session was never freed.
- `timeout` and `timeoutSeconds` together were a hard native error; the wrapper now sends only `timeout` (ms) and warns once. `timeout: 0` means unset.
- `headerPriority: null` omits the field on the ja3 path (native then applies no priority); leaving it unset still sends the zeroed priority earlier versions sent.
- `H2Settings.ENABLE_PUSH` is typed `number` (native rejects booleans); `headerOrder` accepts `string[]`.
- `SessionOptions.sessionId` is honored (it was documented but always replaced by a random UUID); two `Session` objects with the same id share one native session.
- Per-request `cookies` values are sent verbatim; a value containing `;` was previously cut at the semicolon.
- A response cookie that cannot be parsed no longer fails an otherwise successful request.

### Notes

- Cookies are kept between requests by the native session jar (`withoutCookieJar` turns it off); `session.cookies()` reports the cookies the session has seen.
- `withProtocolRacing` with a non-SOCKS5 proxy is rejected by native 1.16.0 (`status: 0`).
- `disableSessionTickets` and `trustAnchorsPayload` need a tls-client build newer than the 1.16.0 release binaries, which predate those fields and silently ignore them.
- Alpine (musl) is not supported yet: upstream only publishes an amd64 Alpine build, and this version does not download it. Use a glibc-based image such as `node:<version>-slim`.
- `initTLS()` downloads the newest upstream release on first use and after a wrapper upgrade. Response `headers` values are `string[]` at runtime.

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
  Usage: [session-cookies.md](https://github.com/Sahil1337/node-tls-client/tree/main/examples/samples/cookie-example.md)
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
  Executable compatibility instructions and examples have been added to the documentation. [Instructions](https://github.com/Sahil1337/node-tls-client/tree/main/examples/samples/executable.md)

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

- Added `session.cookies` property to retrieve all session cookies. For detailed information, see [examples/session-cookies.md](https://github.com/Sahil1337/node-tls-client/tree/main/examples/samples/cookie-example.md).
- Added `byteResponse` option in requestOptions. Setting this to true ensures that the response is treated as a byte response. For detailed information, see [examples/images.js](https://github.com/Sahil1337/node-tls-client/tree/main/examples/images.js)
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

- `fetch(fetchOptions)` method have been added to use different timeouts & rejectUnauthorized values in each request. [examples/timeout.js] for more information.

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
