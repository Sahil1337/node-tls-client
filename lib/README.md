# Native Libraries

This directory contains the native DLL/SO/dylib files for various platforms and architectures.

## Included Files

- `tls-client-64.dll` - Windows x64
- `tls-client-32.dll` - Windows x86
- `tls-client-arm64.so` - Linux ARM64
- `tls-client-x64.so` - Linux x64
- `tls-client-amd64.so` - Linux AMD64 (Ubuntu)

## How to Update Libraries

1. Download the latest libraries from the [tls-client releases](https://github.com/bogdanfinn/tls-client/releases)
2. Rename them according to the naming convention used in this directory
3. Replace the existing files

## File Naming Convention

Files are named according to the following format:
- Windows: `tls-client-{arch}.dll`
- Linux: `tls-client-{arch}.so`

Where `{arch}` is the target architecture (64, 32, arm64, x64, etc.).
