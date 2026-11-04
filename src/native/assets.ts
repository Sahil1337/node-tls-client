import { TlsClientError } from "../utils/tlsError";

/** One platform's shared library: cache filename and upstream release asset names. */
export interface LibraryAsset {
  /** Platform suffix of the cached filename, e.g. `darwin-arm64.dylib`. */
  name: string;
  /** Filename used by node-tls-client ≤ 2.1.0 (offline fallback only). */
  legacyName: string;
  /** Release asset names to try in order; `{version}` is substituted. */
  downloadNames: string[];
}

const xgo = (goos: string, goarch: string, ext: string) =>
  `tls-client-xgo-{version}-${goos}-${goarch}.${ext}`;

/**
 * Release asset names per platform. Upstream publishes two naming schemes
 * (xgo since 1.15, the hand-built legacy names up to 1.15.1); the current
 * one is tried first.
 */
const ASSETS: Partial<Record<string, Partial<Record<string, LibraryAsset>>>> = {
  darwin: {
    arm64: {
      name: "darwin-arm64.dylib",
      legacyName: "tls-client-arm64.dylib",
      downloadNames: [
        xgo("darwin", "arm64", "dylib"),
        "tls-client-darwin-arm64-{version}.dylib",
      ],
    },
    x64: {
      name: "darwin-amd64.dylib",
      legacyName: "tls-client-x86.dylib",
      downloadNames: [
        xgo("darwin", "amd64", "dylib"),
        "tls-client-darwin-amd64-{version}.dylib",
      ],
    },
  },
  win32: {
    x64: {
      name: "windows-amd64.dll",
      legacyName: "tls-client-64.dll",
      downloadNames: [
        xgo("windows", "amd64", "dll"),
        "tls-client-windows-64-{version}.dll",
      ],
    },
    ia32: {
      name: "windows-386.dll",
      legacyName: "tls-client-32.dll",
      downloadNames: [
        xgo("windows", "386", "dll"),
        "tls-client-windows-32-{version}.dll",
      ],
    },
  },
  linux: {
    x64: {
      name: "linux-amd64.so",
      legacyName: "tls-client-x64.so",
      downloadNames: [
        xgo("linux", "amd64", "so"),
        "tls-client-linux-ubuntu-amd64-{version}.so",
      ],
    },
    arm64: {
      name: "linux-arm64.so",
      legacyName: "tls-client-arm64.so",
      downloadNames: [
        xgo("linux", "arm64", "so"),
        "tls-client-linux-arm64-{version}.so",
      ],
    },
    arm: {
      name: "linux-arm.so",
      legacyName: "tls-client-armv7.so",
      downloadNames: [
        xgo("linux", "arm-7", "so"),
        xgo("linux", "arm-6", "so"),
        "tls-client-linux-armv7-{version}.so",
      ],
    },
    ia32: {
      name: "linux-386.so",
      legacyName: "tls-client-386.so",
      downloadNames: [xgo("linux", "386", "so")],
    },
    ppc64: {
      name: "linux-ppc64le.so",
      legacyName: "tls-client-ppc64le.so",
      downloadNames: [xgo("linux", "ppc64le", "so")],
    },
    s390x: {
      name: "linux-s390x.so",
      legacyName: "tls-client-s390x.so",
      downloadNames: [xgo("linux", "s390x", "so")],
    },
    riscv64: {
      name: "linux-riscv64.so",
      legacyName: "tls-client-riscv64.so",
      downloadNames: [xgo("linux", "riscv64", "so")],
    },
  },
};

/** The shared library asset for this platform; throws when upstream publishes none. */
export function platformAsset(): LibraryAsset {
  const asset = ASSETS[process.platform]?.[process.arch];
  if (!asset) {
    throw new TlsClientError(
      `tls-client publishes no shared library for ${process.platform}/${process.arch}.`,
    );
  }
  return asset;
}
