import { OutgoingHttpHeaders } from "http";

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

/**
 * Determines if a request should be treated as a byte request based on its headers.
 *
 * This function checks the "Content-Type", "Content-Transfer-Encoding" and "Content-Encoding" headers
 * to determine if the request is for binary data (such as images, audio, video,
 * application binaries, etc.). If the headers indicate binary data, it returns true.
 *
 * @param {OutgoingHttpHeaders} headers - The headers of the request.
 * @returns {boolean} - Returns true if the request is for binary data, otherwise false.
 */
export function isByteRequest(headers: OutgoingHttpHeaders): boolean {
  if (headers["content-encoding"] || headers["Content-Encoding"]) return true;

  const contentType = headers["content-type"] || headers["Content-Type"];
  const contentTransferEncoding =
    headers["content-transfer-encoding"] ||
    headers["Content-Transfer-Encoding"];

  if (contentTransferEncoding) {
    const encodingString = String(contentTransferEncoding);
    if (exactContentTypes.has(encodingString)) {
      return true;
    }
  }

  if (contentType) {
    const contentTypeString = String(contentType);

    if (exactContentTypes.has(contentTypeString)) {
      return true;
    }

    for (const prefix of prefixContentTypes) {
      if (contentTypeString.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}
