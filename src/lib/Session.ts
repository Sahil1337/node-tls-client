import { randomUUID } from "crypto";
import { Cookies } from "./Cookie";
import {
  ClientIdentifier,
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
  TlsResponse,
} from "../interface";
import { OutgoingHttpHeaders } from "http2";
import { URL } from "url";
import { isByteRequest, logger } from "../utils";
import { Payload } from "../interface/payload";
import { Client } from "./Client";
import { Response } from "./Response";

const __version__ = "2.1.0";

export class Session {
  private jar = new Cookies();
  private sessionId = randomUUID();

  constructor(private readonly config: SessionOptions = {}) {}

  public async cookies() {
    return this.jar.fetchAllCookies();
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
   * The 'close' method closes the current session.
   *
   * @returns The response from the 'destroySession' function.
   */
  public async close() {
    return Client.getInstance().pool?.run(
      JSON.stringify({
        sessionId: this.sessionId,
      }),
      { name: "destroySession" }
    );
  }

  protected async execute(
    method: Methods,
    url: string | URL,
    options: RequestOptions = {}
  ) {
    const headers =
      options?.headers !== undefined
        ? options.headers
        : this.config.headers ?? this.getDefaultHeaders();

    const requestCookies = await this.jar.mergeCookies(
      options?.cookies || {},
      url.toString()
    );

    const payload: Payload = {
      sessionId: this.sessionId,
      followRedirects: options.followRedirects ?? false,
      forceHttp1: this.config.forceHttp1 ?? false,
      withDebug: this.config.debug ?? false,
      headers,
      headerOrder: options.headerOrder || this.config.headerOrder || [],
      insecureSkipVerify: this.config.insecureSkipVerify ?? false,
      proxyUrl: options.proxy || this.config.proxy || "",
      isRotatingProxy:
        options?.isRotatingProxy ?? this.config.isRotatingProxy ?? false,
      requestUrl: url,
      requestMethod: method,
      requestBody: options?.body || null,
      timeoutMilliseconds: this.config.timeout || 0,
      withRandomTLSExtensionOrder: this.config.randomTlsExtensionOrder ?? false,
      isByteResponse: options?.byteResponse ?? false,
      isByteRequest: isByteRequest(headers),
      requestHostOverride: options?.hostOverride || null,
      disableIPV6: this.config.disableIPV6 ?? false,
      disableIPV4: this.config.disableIPV4 ?? false,
      transportOptions: this.config.transportOptions ?? undefined,
      catchPanics: false,
      streamOutputEOFSymbol: this.config.streamOutputEOFSymbol ?? null,
      streamOutputPath: this.config.streamOutputPath ?? null,
      streamOutputBlockSize: this.config.streamOutputBlockSize ?? null,
      serverNameOverwrite: this.config.serverNameOverwrite ?? "",
      connectHeaders:
        this.config.connectHeaders ?? options.connectHeaders ?? {},
      localAddress: this.config.localAddress ?? null,
      withDefaultCookieJar: true,
      withoutCookieJar: false,
      requestCookies,
    };

    if (this.config.clientIdentifier) {
      payload["tlsClientIdentifier"] = this.config.clientIdentifier;
    } else if (this.config.ja3string) {
      payload["customTlsClient"] = {
        ja3String: this.config.ja3string,
        h2Settings: this.config.h2Settings ?? {},
        h2SettingsOrder: this.config.h2SettingsOrder ?? [],
        pseudoHeaderOrder: this.config.pseudoHeaderOrder ?? [],
        connectionFlow: this.config.connectionFlow ?? 0,
        priorityFrames: this.config.priorityFrames ?? [],
        headerPriority: this.config.headerPriority ?? {
          streamDep: 0,
          exclusive: false,
          weight: 0,
        },
        certCompressionAlgo: this.config.certCompressionAlgo ?? "zlib",
        supportedVersions: this.config.supportedVersions ?? [],
        supportedSignatureAlgorithms:
          this.config.supportedSignatureAlgorithms ?? [],
        keyShareCurves: this.config.keyShareCurves ?? [],
        alpnProtocols: this.config.alpnProtocols ?? [],
        alpsProtocols: this.config.alpsProtocols ?? [],
      };
    } else payload["tlsClientIdentifier"] = ClientIdentifier.chrome_131;

    const requestPayloadString = JSON.stringify(payload);

    const rawResponse = await Client.getInstance().pool.run(
      requestPayloadString,
      {
        name: "request",
      }
    );

    const response: TlsResponse = JSON.parse(rawResponse);

    const cookies = await this.jar.syncCookies(
      response.cookies || {},
      url.toString()
    );

    setImmediate(() => {
      this.freeMemory(response.id).catch(() => {});
    });

    return new Response({ ...response, cookies });
  }

  private async freeMemory(id: string): Promise<void> {
    return Client.getInstance().pool?.run(id.toString(), {
      name: "freeMemory",
    });
  }

  private getDefaultHeaders(): OutgoingHttpHeaders {
    return {
      "User-Agent": `tls-client/${__version__}`,
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
      Connection: "keep-alive",
    };
  }
}
