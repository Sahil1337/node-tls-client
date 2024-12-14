import { KoffiFunction } from "koffi";

export interface IClient {
  request: KoffiFunction;
  freeMemory: KoffiFunction;
  destroyAll: KoffiFunction;
  destroySession: KoffiFunction;
}
