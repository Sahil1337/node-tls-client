export interface TlsNativeLibrary {
  request: (payload: string) => Promise<string>;
  freeMemory: (id: string) => void;
  destroyAll: () => Promise<string>;
  destroySession: (payload: string) => Promise<string>;
}

export type FileInfo = {
  /** Platform suffix of the cached filename, e.g. `darwin-arm64.dylib`. */
  name: string;
  /** Filename used by node-tls-client ≤ 2.1.0 (offline fallback only). */
  legacyName: string;
  /** Release asset names to try in order; `{version}` is substituted. */
  downloadNames: string[];
};

export type PlatformMap = {
  [platform: string]: { [arch: string]: FileInfo };
};
