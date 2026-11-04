import { InitTLSOptions } from "../types";
import { destroyClient, initClient } from "../native/runtime";

/**
 * Locates (downloading on first use) and loads the native tls-client
 * library. Must be awaited before any request; calling it again while
 * initialized is a no-op.
 */
export async function initTLS(options?: InitTLSOptions): Promise<void> {
  return initClient(options);
}

/**
 * Rejects new requests, waits for in-flight ones, then clears all native
 * session state. `initTLS()` can be called again afterwards.
 */
export async function destroyTLS(): Promise<void> {
  return destroyClient();
}
