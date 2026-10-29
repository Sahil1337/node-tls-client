import { TlsResponse } from "../interface";
import { IncomingHttpHeaders } from "http";

export class Response {
  // Indicates whether the response was successful (status in the range 200-299) or not.
  public ok: boolean;

  // Represents the response headers.
  public headers: IncomingHttpHeaders;

  // Represents the HTTP status code of the response.
  public status: number;

  // Represents the URL of the response.
  public url: string;

  // The response body
  public body: string;

  // The cookies from the response
  public cookies: Record<string, string>;

  // Protocol negotiated for this response, e.g. "HTTP/1.1", "HTTP/2.0", "HTTP/3.0"
  public usedProtocol: string;

  constructor(response: TlsResponse) {
    this.ok = response.status >= 200 && response.status < 300;
    this.headers = response.headers;
    this.status = response.status;
    this.url = response.target;
    this.body = response.body;
    this.cookies = response.cookies;
    this.usedProtocol = response.usedProtocol;
  }

  /**
   * Returns the body of the response as a string.
   *
   * @returns A promise that resolves with the body of the response as a string.
   */
  public async text(): Promise<string> {
    return this.body;
  }

  /**
   * Returns the body of the response as a JSON object.
   *
   * @typeParam T - The type of the JSON object.
   * @returns A promise that resolves with the body of the response as a JSON object.
   */
  public async json<T>(): Promise<T> {
    return JSON.parse(this.body) as T;
  }
}
