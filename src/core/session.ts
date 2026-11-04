import { randomUUID } from "crypto";
import { URL } from "url";
import {
  DeleteRequestOptions,
  GetRequestOptions,
  HeadRequestOptions,
  Methods,
  OptionsRequestOptions,
  PatchRequestOptions,
  PostRequestOptions,
  PutRequestOptions,
  RequestOptions,
  SessionOptions,
} from "../types";
import { NativeClient } from "../native/client";
import { CookieMirror } from "./cookie-mirror";
import { buildPayload } from "./payload";
import { Response } from "./response";

export class Session {
  private readonly jar = new CookieMirror();
  private readonly sessionId: string;
  private closePromise: Promise<string> | null = null;

  constructor(private readonly config: SessionOptions = {}) {
    // Two Session objects with the same id share one native session
    // (cookie jar, connections); close() on either frees it.
    this.sessionId = config.sessionId ?? randomUUID();
  }

  public async cookies() {
    return this.jar.all();
  }

  /**
   * The 'GET' method performs a GET request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the GET request to.
   * @param options - The options for the GET request.
   *
   * @returns The response from the 'execute' method.
   */
  public get(url: string, options: GetRequestOptions = {}) {
    return this.execute("GET", url, options);
  }

  /**
   * The 'DELETE' method performs a DELETE request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the DELETE request to.
   * @param options - The options for the DELETE request.
   *
   * @returns The response from the 'execute' method.
   */
  public delete(url: string, options: DeleteRequestOptions = {}) {
    return this.execute("DELETE", url, options);
  }

  /**
   * The 'OPTIONS' method performs an OPTIONS request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the OPTIONS request to.
   * @param options - The options for the OPTIONS request.
   *
   * @returns The response from the 'execute' method.
   */
  public options(url: string, options: OptionsRequestOptions = {}) {
    return this.execute("OPTIONS", url, options);
  }

  /**
   * The 'HEAD' method performs a HEAD request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the HEAD request to.
   * @param options - The options for the HEAD request.
   *
   * @returns The response from the 'execute' method.
   */
  public head(url: string, options: HeadRequestOptions = {}) {
    return this.execute("HEAD", url, options);
  }

  /**
   * The 'POST' method performs a POST request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the POST request to.
   * @param options - The options for the POST request.
   *
   * @returns The response from the 'execute' method.
   */
  public post(url: string, options: PostRequestOptions = {}) {
    return this.execute("POST", url, options);
  }

  /**
   * The 'PATCH' method performs a PATCH request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the PATCH request to.
   * @param options - The options for the PATCH request.
   *
   * @returns The response from the 'execute' method.
   */
  public patch(url: string, options: PatchRequestOptions = {}) {
    return this.execute("PATCH", url, options);
  }

  /**
   * The 'PUT' method performs a PUT request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the PUT request to.
   * @param options - The options for the PUT request.
   *
   * @returns The response from the 'execute' method.
   */
  public put(url: string, options: PutRequestOptions = {}) {
    return this.execute("PUT", url, options);
  }

  /**
   * The 'close' method closes the current session (frees native session
   * state). Idempotent: repeated calls return the first result.
   *
   * @returns Native's JSON reply (`{ id, success }`).
   */
  public close(): Promise<string> {
    this.closePromise ??= this.destroyNativeSession().catch((e) => {
      this.closePromise = null; // let a failed close be retried
      throw e;
    });
    return this.closePromise;
  }

  protected async execute(
    method: Methods,
    url: string | URL,
    options: RequestOptions = {},
  ) {
    const requestUrl = url.toString();
    const payload = buildPayload({
      sessionId: this.sessionId,
      session: this.config,
      method,
      url: requestUrl,
      request: options,
    });
    this.jar.recordRequest(payload.requestCookies, requestUrl);
    const response = await NativeClient.get().request(payload);
    response.cookies = this.jar.recordResponse(response.cookies, requestUrl);
    return new Response(response);
  }

  /** Async so a missing initTLS() rejects instead of throwing synchronously. */
  private async destroyNativeSession(): Promise<string> {
    return NativeClient.get().destroySession(this.sessionId);
  }
}
