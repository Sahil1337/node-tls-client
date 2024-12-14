import { TlsClientError } from "../utils/tlsError";

export function verifyClientState() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if ("isReady" in this && this.isReady && "pool" in this && this.pool) {
        return method.apply(this, args);
      } else {
        throw new TlsClientError("Client is not yet ready.");
      }
    };

    return descriptor;
  };
}
