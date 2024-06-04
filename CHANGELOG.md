# 1.1.1 (June 4 2024)
## Additions
- Implemented dynamic methods for downloading shared files in "node-tls-client", eliminating the inclusion of prebuilt files.
## Changes
- Path used for storing the shared library files is strictly set to tmpdir path.
## Benefits
- Reduces package size.
- Ensures better support for executables.

# 1.1.0 (June 3, 2024)
## Changes
- Improved handling of shared library files:
  - Only the shared library file matching the current operating system is preserved. All other shared library files are deleted.
- Added support for executables.
