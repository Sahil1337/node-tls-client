export interface koffiLoad {
  request: (body: string) => string;
  freeMemory: (sessionId: string) => void;
  destroyAll: () => string;
  destroySession: (sessionId: string) => string;
}
