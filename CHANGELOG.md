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
