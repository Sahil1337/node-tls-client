const exactContentTypes = new Set([
  "application/octet-stream",
  "application/pdf",
  "application/zip",
  "application/gzip",
  "application/x-rar-compressed",
  "application/x-msdownload",
  "application/x-sh",
  "application/x-binary",
  "base64",
]);

const prefixContentTypes = new Set([
  "image/",
  "audio/",
  "video/",
  "application/vnd.",
]);

function lookup(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name) return headers[key];
  }
  return undefined;
}

/**
 * Determines if a request should be treated as a byte request based on its headers.
 *
 * Checks "Content-Type", "Content-Transfer-Encoding" and "Content-Encoding"
 * (case-insensitively) for binary payloads (images, audio, video, archives,
 * base64 transfer encoding, …).
 */
export function isByteRequest(headers: Record<string, string>): boolean {
  if (lookup(headers, "content-encoding")) return true;

  const contentTransferEncoding = lookup(headers, "content-transfer-encoding");
  if (
    contentTransferEncoding &&
    exactContentTypes.has(contentTransferEncoding)
  ) {
    return true;
  }

  const contentType = lookup(headers, "content-type");
  if (contentType) {
    if (exactContentTypes.has(contentType)) return true;
    for (const prefix of prefixContentTypes) {
      if (contentType.startsWith(prefix)) return true;
    }
  }

  return false;
}

/**
 * Extract the response `id` from native's JSON (request/destroySession/
 * destroyAll all register their C string under it). Returns "" when the
 * payload is not parseable or carries no id — `freeMemory("")` is a no-op.
 */
export function parseNativeId(raw: string): string {
  try {
    const id = JSON.parse(raw)?.id;
    return typeof id === "string" ? id : "";
  } catch {
    return "";
  }
}
