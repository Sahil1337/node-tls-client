import { LibraryHandler } from "../utils/native";

const instance = LibraryHandler.retrieveLibrary();

export function request(payload: string) {
  if (!payload) return;
  return instance.request(payload);
}

export function destroySession(payload: string) {
  if (!payload) return;
  return instance.destroySession(payload);
}

export function destroyAll() {
  return instance.destroyAll();
}

export function freeMemory(payload: string) {
  if (!payload) return;
  return instance.freeMemory(payload);
}

export default request;
