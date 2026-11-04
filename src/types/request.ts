import { OutgoingHttpHeaders } from "http";
import { SessionOptions } from "./session";

/**
 * Headers as accepted by `SessionOptions.headers`, request options and
 * `fetch()`. A superset of Node's `OutgoingHttpHeaders`: numbers are sent as
 * strings, arrays joined with `", "`, and `null`/`undefined` REMOVES the header
 * (useful per request to drop a session header).
 */
export type HeaderInput = Record<
  string,
  string | number | readonly string[] | null | undefined
>;

/**
 * Represents various HTTP methods.
 */
export type Methods =
  "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

/**
 * Represents base options for making HTTP requests, excluding the body.
 */
export interface BaseRequestOptions {
  /**
   * The headers for the request. Layered over the session headers per key,
   * case-insensitively; a `null`/`undefined` value removes a session header.
   */
  headers?: HeaderInput;

  /**
   * The headers for the connect request.
   */
  connectHeaders?: Record<string, string[]>;

  /**
   * The order of headers.
   */
  headerOrder?: string[] | OutgoingHttpHeaders[];

  /**
   * Whether to follow redirects.
   */
  followRedirects?: boolean;

  /**
   * The proxy server to use for the request.
   */
  proxy?: string;

  /**
   * Whether proxy is rotating proxy or not.
   */
  isRotatingProxy?: boolean;

  /**
   * Cookies for the request.
   */
  cookies?: Record<string, string | number>;

  /**
   * If true, indicates the response is in binary format, like base64-encoded images.
   */
  byteResponse?: boolean;

  /**
   * Used to override the Host header, typically needed when making requests directly to an IP address.
   */
  hostOverride?: string | null;
}

/**
 * Represents options for making HTTP requests that may include a body.
 */
export interface RequestOptions extends BaseRequestOptions {
  /**
   * Request body: a string, or a `Buffer`/`Uint8Array` (sent base64-encoded as
   * a byte request). Objects are rejected — `JSON.stringify` them first.
   */
  body?: string | Buffer | Uint8Array | null;
}

/**
 * Represents options for making a GET HTTP request.
 */
export interface GetRequestOptions extends BaseRequestOptions {}

/**
 * Represents options for making a POST HTTP request.
 */
export interface PostRequestOptions extends RequestOptions {}

/**
 * Represents options for making a PUT HTTP request.
 */
export interface PutRequestOptions extends RequestOptions {}

/**
 * Represents options for making a DELETE HTTP request.
 */
export interface DeleteRequestOptions extends BaseRequestOptions {}

/**
 * Represents options for making a PATCH HTTP request.
 */
export interface PatchRequestOptions extends RequestOptions {}

/**
 * Represents options for making an OPTIONS HTTP request.
 */
export interface OptionsRequestOptions extends BaseRequestOptions {}

/**
 * Represents options for making a HEAD HTTP request.
 */
export interface HeadRequestOptions extends BaseRequestOptions {}

/**
 *  Represents options for making HTTP requests.
 */
export interface fetchOptions {
  /**
   * Request method.
   */
  method?: Methods;

  /**
   * The headers for the request.
   */
  headers?: HeaderInput;

  /**
   * The body of the request (string, or Buffer for binary payloads).
   */
  body?: string | Buffer | Uint8Array | null;

  /**
   * Whether to follow redirects.
   */
  followRedirects?: boolean;

  /**
   * The proxy server to use for the request.
   */
  proxy?: string;

  /**
   * Whether proxy is rotating proxy or not.
   */
  isRotatingProxy?: boolean;

  /**
   * Cookies for the request.
   */
  cookies?: Record<string, string | number>;

  /**
   * Additional session options.
   */
  options?: SessionOptions;
}
