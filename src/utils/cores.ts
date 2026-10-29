import os from "os";

export function cpuCount(): number {
  return typeof os.availableParallelism === "function"
    ? os.availableParallelism()
    : os.cpus().length;
}
