export * from "./session";
export type { InitTLSOptions } from "./backend";
export type { TlsNativeLibrary } from "./native";
import type { TlsNativeLibrary } from "./native";

/**
 * @deprecated since 2.2.0 — the native bindings are now promise-returning
 * functions; use {@link TlsNativeLibrary}. Kept so `import { IClient }` still compiles.
 */
export type IClient = TlsNativeLibrary;
