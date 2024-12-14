import { TlsResponse } from "../interface";
import { IncomingHttpHeaders } from "http";

export class Response {
  // Indicates whether the response was successful (status in the range 200-299) or not.
  public readonly ok: boolean;

  // Represents the response headers.
  public readonly headers: IncomingHttpHeaders;

  // Represents the HTTP status code of the response.
  public readonly status: number;

  // Represents the URL of the response.
  public readonly url: string;

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
   * @returns An object containing cookies as key-value pairs.
   */
  public get cookies() {
    return this.response.cookies;
  }
}
