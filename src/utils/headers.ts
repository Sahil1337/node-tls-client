import { HeaderInput } from "../types/request";

/**
 * Combine session-level and request-level headers (#14): request headers
 * layer over session headers per key (case-insensitive; the request's value
 * and casing win but the session's position is kept; `null`/`undefined`
 * removes a session header). Returns `undefined` only when NEITHER side
 * supplied a headers object, so the caller can apply library defaults —
 * exactly 2.1.0's rule (an explicit `{}` is honored and sent as `{}`).
 */
export function mergeHeaders(
  session: HeaderInput | undefined,
  request: HeaderInput | undefined,
): Record<string, string> | undefined {
  if (session === undefined && request === undefined) return undefined;
  // Lower-cased name → [name as last written, value]; a Map keeps insertion order.
  const merged = new Map<string, [string, string]>();
  for (const source of [session, request]) {
    for (const [key, raw] of Object.entries(source ?? {})) {
      const lower = key.toLowerCase();
      if (raw === null || raw === undefined) merged.delete(lower);
      else
        merged.set(lower, [
          key,
          Array.isArray(raw) ? raw.join(", ") : String(raw),
        ]);
    }
  }
  return Object.fromEntries(merged.values());
}

const BINARY_CONTENT_TYPES = new Set([
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

const BINARY_CONTENT_TYPE_PREFIXES = [
  "image/",
  "audio/",
  "video/",
  "application/vnd.",
];

/** Value of the header `lowerName`, matching header names case-insensitively. */
function headerValue(
  headers: Record<string, string>,
  lowerName: string,
): string | undefined {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lowerName) return headers[key];
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
  if (headerValue(headers, "content-encoding")) return true;

  const transferEncoding = headerValue(headers, "content-transfer-encoding");
  if (transferEncoding && BINARY_CONTENT_TYPES.has(transferEncoding)) {
    return true;
  }

  const contentType = headerValue(headers, "content-type");
  return (
    contentType !== undefined &&
    (BINARY_CONTENT_TYPES.has(contentType) ||
      BINARY_CONTENT_TYPE_PREFIXES.some((prefix) =>
        contentType.startsWith(prefix),
      ))
  );
}
