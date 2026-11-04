/** Whether this process runs on glibc; `true` when the runtime can't tell. */
export function hasGlibc(): boolean {
  try {
    const report = process.report?.getReport() as
      { header?: { glibcVersionRuntime?: string } } | undefined;
    return report?.header?.glibcVersionRuntime !== undefined;
  } catch {
    return true;
  }
}
