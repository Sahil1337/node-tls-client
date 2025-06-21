import { KoffiFunction } from "koffi";

export interface TlsNativeLibrary {
  request: KoffiFunction;
  freeMemory: KoffiFunction;
  destroyAll: KoffiFunction;
  destroySession: KoffiFunction;
}

type ArchMap = {
  [arch: string]: FileInfo;
};

export type FileInfo = {
  name: string;
  downloadName: string;
};

export type PlatformMap = {
  [platform: string]: ArchMap;
};
