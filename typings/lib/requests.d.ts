import { fetchOptions } from "../interface";
import { Response } from "./Response";
/**
 * Makes an HTTP request using the specified URL and options.
 *
 * @param {string} url - The URL to make the request to.
 * @param {fetchOptions} [options] - Optional parameters for the request.
 * @returns {Promise<Response>} The response from the HTTP request.
 * @throws Will throw an error if the HTTP request fails or the method is not allowed.
 */
export declare function fetch(url: string, options?: fetchOptions): Promise<Response>;
