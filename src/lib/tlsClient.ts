import { Client } from "./Client";

export async function initTLS(): Promise<void> {
  return Client.init();
}

export async function destroyTLS(): Promise<void> {
  return Client.destroy();
}
