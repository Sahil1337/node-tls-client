import { response as ResponseType } from "../interface";
import { IncomingHttpHeaders } from "http";

/**
 * Response class represents the HTTP response received from a server.
 * It provides methods to access various properties of the response.
 */
export class Response {
  // The 'ok' property is a boolean indicating whether the response was successful (status in the range 200-299) or not.
  public ok: boolean;

  // The 'headers' property is an object representing the response headers.
  public headers: IncomingHttpHeaders;

  // The 'status' property is a number representing the HTTP status code of the response.
  public status: number;

  // The 'url' property is a string representing the URL of the response.
  public url: string;

  /**
   * Constructor for the Response class.
   * It initializes the properties of the class with the values from the provided response object.
   *
   * @param response - The response object from which to initialize the class properties.
   */
  constructor(private response: ResponseType) {
    this.ok = response.status >= 200 && response.status < 300 ? true : false;
    this.headers = response.headers;
    this.status = response.status;
    this.url = response.target;
  }

  /**
   * The 'text' method returns the body of the response as a string.
   *
   * @returns The body of the response as a string.
   *
   * @example
   * const response = new Response(someResponseType);
   * const text = response.text();
   */
  public text() {
    return Buffer.from(this.response?.body).toString("utf-8");
  }

  /**
   * The 'json' method returns the body of the response as a JSON object.
   *
   * @returns The body of the response as a JSON object.
   *
   * @example
   * const response = new Response(someResponseType);
   * const json = response.json();
   */
  public json<T>() {
    return JSON.parse(this.response?.body) as T;
  }

  /**
   * The 'cookies' method returns the cookies from the response.
   *
   * @returns The cookies from the response.
   *
   * @example
   * const response = new Response(someResponseType);
   * const cookies = response.cookies();
   */
  public async cookies() {
    return this.response.cookies;
  }
}
