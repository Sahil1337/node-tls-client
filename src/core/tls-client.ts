import { Client } from "./client";
import { InitTLSOptions } from "../interface";

export async function initTLS(options?: InitTLSOptions): Promise<void> {
  return Client.init(options);
}

export async function destroyTLS(): Promise<void> {
  return Client.destroy();
}
