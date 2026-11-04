import { fetchOptions, Methods } from "../types";
import { TlsClientError } from "../utils";
import { Response } from "./response";
import { Session } from "./session";

const METHODS: ReadonlySet<string> = new Set<Methods>([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
]);

/**
 * Makes an HTTP request using the specified URL and options, in a one-off
 * session that is closed afterwards.
 *
 * @param {string} url - The URL to make the request to.
 * @param {fetchOptions} [options] - Optional parameters for the request.
 * @returns {Promise<Response>} The response from the HTTP request.
 * @throws Will throw an error if the HTTP request fails or the method is not allowed.
 */
export async function fetch(
  url: string,
  options: fetchOptions = {},
): Promise<Response> {
  const method = options.method?.toUpperCase() || "GET";
  if (!METHODS.has(method)) {
    throw new TlsClientError(`HTTP method ${method} is not allowed.`);
  }

  const session = new Session(options.options);
  try {
    return await session[method.toLowerCase() as Lowercase<Methods>](
      url,
      options,
    );
  } catch (error) {
    throw TlsClientError.from(error);
  } finally {
    await session.close().catch(() => {});
  }
}
