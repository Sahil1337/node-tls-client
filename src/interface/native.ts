export interface TlsNativeLibrary {
  request: (payload: string) => Promise<string>;
  freeMemory: (payload: string) => Promise<void>;
  destroyAll: () => Promise<string>;
  destroySession: (payload: string) => Promise<string>;
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
