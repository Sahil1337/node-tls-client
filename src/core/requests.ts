import {
  DeleteRequestOptions,
  fetchOptions,
  GetRequestOptions,
  HeadRequestOptions,
  OptionsRequestOptions,
  PatchRequestOptions,
  PostRequestOptions,
  PutRequestOptions,
  SessionOptions,
} from "../interface";
import { Response, Session } from ".";
import { TlsClientError } from "../utils";

/**
 * Makes an HTTP request using the specified URL and options.
 *
 * @param {string} url - The URL to make the request to.
 * @param {fetchOptions} [options] - Optional parameters for the request.
 * @returns {Promise<Response>} The response from the HTTP request.
 * @throws Will throw an error if the HTTP request fails or the method is not allowed.
 */
export async function fetch(
  url: string,
  options?: fetchOptions
): Promise<Response> {
  const session = new Session(options?.options as SessionOptions);
  const method = options?.method?.toUpperCase() || "GET";

  try {
    let response;

    switch (method) {
      case "GET":
        response = await session.get(url, options as GetRequestOptions);
        break;
      case "POST":
        response = await session.post(url, options as PostRequestOptions);
        break;
      case "PUT":
        response = await session.put(url, options as PutRequestOptions);
        break;
      case "DELETE":
        response = await session.delete(url, options as DeleteRequestOptions);
        break;
      case "HEAD":
        response = await session.head(url, options as HeadRequestOptions);
        break;
      case "OPTIONS":
        response = await session.options(url, options as OptionsRequestOptions);
        break;
      case "PATCH":
        response = await session.patch(url, options as PatchRequestOptions);
        break;
      default:
        throw new Error(`HTTP method ${method} is not allowed.`);
    }

    return response;
  } catch (error) {
    throw new TlsClientError(error as Error);
  } finally {
    await session.close();
  }
}
