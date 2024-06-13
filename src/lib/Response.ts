import { TlsResponse } from "../interface";
import { IncomingHttpHeaders } from "http";

/**
 * Response class represents the HTTP response received from a server.
 * It provides methods to access various properties of the response.
 */
export class Response {
  // Indicates whether the response was successful (status in the range 200-299) or not.
  public readonly ok: boolean;

  // Represents the response headers.
  public readonly headers: IncomingHttpHeaders;

  // Represents the HTTP status code of the response.
  public readonly status: number;

  // Represents the URL of the response.
  public readonly url: string;

  /**
   * Constructor for the Response class.
   * Initializes the properties of the class with the values from the provided response object.
   *
   * @param response - The response object from which to initialize the class properties.
   */
  constructor(private readonly response: TlsResponse) {
    this.ok = response.status >= 200 && response.status < 300;
    this.headers = response.headers;
    this.status = response.status;
    this.url = response.target;
  }

  /**
   * Returns the body of the response as a string.
   *
   * @returns A promise that resolves with the body of the response as a string.
   */
  public async text(): Promise<string> {
    return this.response.body.toString();
  }

  /**
   * Returns the body of the response as a JSON object.
   *
   * @typeparam T - The type of the JSON object.
   * @returns A promise that resolves with the body of the response as a JSON object.
   */
  public async json<T>(): Promise<T> {
    return JSON.parse(this.response.body) as T;
  }

  /**
   * Returns the cookies from the response as an object with key-value pairs.
   *
   * @returns A promise that resolves with the cookies from the response as an object.
   */
  public cookies(): { [key: string]: string } {
    return this.response.cookies as { [key: string]: string };
  }
}
