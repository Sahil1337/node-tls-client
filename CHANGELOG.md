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
