import { randomUUID } from "crypto";
import {
  H2Settings,
  SupportedSignatureAlgorithms,
  SupportedVersions,
  PseudoHeaderOrder,
  PriorityFrames,
  KeyShareCurves,
  CertCompressionAlgo,
  PriorityParam,
  Methods,
  RequestOptions,
  GetRequestOptions,
  PostRequestOptions,
  PatchRequestOptions,
  PutRequestOptions,
  DeleteRequestOptions,
  OptionsRequestOptions,
  HeadRequestOptions,
  SessionOptions,
  ClientIdentifier,
  TlsResponse,
} from "../interface/session";
import { OutgoingHttpHeaders } from "http";
import { isByteRequest, TlsClientError } from "../utils";
import { verifyClientState } from "../decorators";
import { Cookies, Response } from ".";
import workerpool from "workerpool";

const __version__ = "1.0.0";

export class Session {
  private sessionId?: string;
  private proxy?: string | null;
  private isRotatingProxy: boolean;
  private clientIdentifier?: ClientIdentifier;
  private ja3string?: string;
  private h2Settings?: H2Settings;
  private h2SettingsOrder?: (keyof H2Settings)[];
  private supportedSignatureAlgorithms?: SupportedSignatureAlgorithms[];
  private supportedVersions?: SupportedVersions[];
  private keyShareCurves?: KeyShareCurves[];
  private certCompressionAlgo?: CertCompressionAlgo;
  private pseudoHeaderOrder?: PseudoHeaderOrder[];
  private connectionFlow?: number;
  private priorityFrames?: PriorityFrames[];
  private headerOrder?: string[];
  private headerPriority?: PriorityParam;
  private randomTlsExtensionOrder?: boolean;
  private forceHttp1?: boolean;
  private debug?: boolean;
  private insecureSkipVerify?: boolean;
  private headers: OutgoingHttpHeaders;
  private alpnProtocols?: string[];
  private alpsProtocols: string[];
  private timeout: number | null;
  private disableIPV6: boolean;
  private disableIPV4: boolean;
  private jar: Cookies = new Cookies();
  private pool?: workerpool.Pool;

  public isReady: boolean = false;

  constructor(options?: SessionOptions) {
    this.sessionId = randomUUID();
    this.proxy = options?.proxy || null;
    this.isRotatingProxy = options?.isRotatingProxy ?? false;
    this.alpnProtocols = options?.alpnProtocols || ["h2", "http/1.1"];
    this.alpsProtocols = options?.alpsProtocols || ["http/1.1"];
    this.headers = options?.headers || {
      "User-Agent": `tls-client/${__version__}`,
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
      Connection: "keep-alive",
    };
    this.clientIdentifier = options?.clientIdentifier;
    this.ja3string = options?.ja3string;
    this.h2Settings = options?.h2Settings;
    this.h2SettingsOrder = options?.h2SettingsOrder;
    this.supportedSignatureAlgorithms = options?.supportedSignatureAlgorithms;
    this.supportedVersions = options?.supportedVersions;
    this.keyShareCurves = options?.keyShareCurves;
    this.certCompressionAlgo = options?.certCompressionAlgo;
    this.pseudoHeaderOrder = options?.pseudoHeaderOrder;
    this.connectionFlow = options?.connectionFlow;
    this.priorityFrames = options?.priorityFrames;
    this.headerPriority = options?.headerPriority;
    this.randomTlsExtensionOrder = options?.randomTlsExtensionOrder || false;
    this.forceHttp1 = options?.forceHttp1 || false;
    this.debug = options?.debug || false;
    this.insecureSkipVerify = options?.insecureSkipVerify || false;
    this.timeout = options?.timeout || 30 * 1000;
    this.disableIPV4 = options?.disableIPV4 ?? false;
    this.disableIPV6 = options?.disableIPV6 ?? false;
  }

  public async init(): Promise<boolean> {
    if (this.isReady) return true;

    try {
      if (!this.pool) {
        this.pool = workerpool.pool(require.resolve("../utils/worker"));
      }

      this.isReady = true;
      return true;
    } catch (error) {
      console.error("Initialization error:", error);
      throw new TlsClientError(error as Error);
    }
  }

  /**
   * Retrieves all cookies from the jar.
   *
   * @returns An object where keys are URLs and values are objects containing cookies as key-value pairs.
   *
   * @example
    { 
       "https://example.com/": {
         "cookie1": "value1",
         "cookie2": "value2"
       },
       "https://anotherdomain.com/": {
         "cookieA": "valueA",
         "cookieB": "valueB"
       }
    }
   */
  public get cookies() {
    return this.jar.fetchAllCookies();
  }

  /**
   * The 'close' method closes the current session.
   *
   * @returns The response from the 'destroySession' function.
   */
  @verifyClientState()
  public async close() {
    const payload = JSON.stringify({
      sessionId: this.sessionId,
    });
    const response = await this.pool?.exec("destroySession", [payload]);
    await this.pool?.terminate();
    return response;
  }

  /**
   * The 'freeMemory' method frees the memory used by the session with the provided id.
   *
   * @param id - The id of the session to free the memory of.
   *
   * @returns The response from the 'destroySession' function.
   */
  @verifyClientState()
  private async free(id: string): Promise<void> {
    await this.pool?.exec("freeMemory", [id]);
    return;
  }

  /**
   * The 'get' method performs a GET request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the GET request to.
   * @param options - The options for the GET request.
   *
   * @returns The response from the 'execute' method.
   */
  @verifyClientState()
  public get(url: string, options?: GetRequestOptions) {
    return this.execute("GET", url, {
      headers: options?.headers,
      redirect: options?.redirect,
      additionalDecode: options?.additionalDecode || false,
      proxy: options?.proxy,
      cookies: options?.cookies,
      byteResponse: options?.byteResponse || false,
      hostOverride: options?.hostOverride || null,
      ...options,
    });
  }

  /**
   * The 'delete' method performs a DELETE request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the DELETE request to.
   * @param options - The options for the DELETE request.
   *
   * @returns The response from the 'execute' method.
   */
  @verifyClientState()
  public delete(url: string, options?: DeleteRequestOptions) {
    return this.execute("DELETE", url, {
      headers: options?.headers,
      redirect: options?.redirect,
      additionalDecode: options?.additionalDecode || false,
      proxy: options?.proxy,
      cookies: options?.cookies,
      byteResponse: options?.byteResponse || false,
      hostOverride: options?.hostOverride || null,
      ...options,
    });
  }

  /**
   * The 'options' method performs an OPTIONS request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the OPTIONS request to.
   * @param options - The options for the OPTIONS request.
   *
   * @returns The response from the 'execute' method.
   */
  @verifyClientState()
  public options(url: string, options?: OptionsRequestOptions) {
    return this.execute("OPTIONS", url, {
      headers: options?.headers,
      redirect: options?.redirect,
      additionalDecode: options?.additionalDecode || false,
      proxy: options?.proxy,
      cookies: options?.cookies,
      hostOverride: options?.hostOverride || null,
      ...options,
    });
  }

  /**
   * The 'head' method performs a HEAD request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the HEAD request to.
   * @param options - The options for the HEAD request.
   *
   * @returns The response from the 'execute' method.
   */
  @verifyClientState()
  public head(url: string, options?: HeadRequestOptions) {
    return this.execute("HEAD", url, {
      headers: options?.headers,
      redirect: options?.redirect,
      additionalDecode: options?.additionalDecode || false,
      proxy: options?.proxy,
      cookies: options?.cookies,
      hostOverride: options?.hostOverride || null,
      ...options,
    });
  }

  /**
   * The 'post' method performs a POST request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the POST request to.
   * @param options - The options for the POST request.
   *
   * @returns The response from the 'execute' method.
   */
  @verifyClientState()
  public post(url: string, options?: PostRequestOptions) {
    return this.execute("POST", url, {
      body: options?.body,
      headers: options?.headers,
      redirect: options?.redirect,
      additionalDecode: options?.additionalDecode || false,
      proxy: options?.proxy,
      cookies: options?.cookies,
      byteResponse: options?.byteResponse || false,
      hostOverride: options?.hostOverride || null,
      ...options,
    });
  }

  /**
   * The 'patch' method performs a PATCH request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the PATCH request to.
   * @param options - The options for the PATCH request.
   *
   * @returns The response from the 'execute' method.
   */
  @verifyClientState()
  public patch(url: string, options?: PatchRequestOptions) {
    return this.execute("PATCH", url, {
      body: options?.body,
      headers: options?.headers,
      redirect: options?.redirect,
      additionalDecode: options?.additionalDecode || false,
      proxy: options?.proxy,
      cookies: options?.cookies,
      byteResponse: options?.byteResponse || false,
      hostOverride: options?.hostOverride || null,
      ...options,
    });
  }

  /**
   * The 'put' method performs a PUT request to the provided URL with the provided options.
   *
   * @param url - The URL to perform the PUT request to.
   * @param options - The options for the PUT request.
   *
   * @returns The response from the 'execute' method.
   */
  @verifyClientState()
  public put(url: string, options?: PutRequestOptions) {
    return this.execute("PUT", url, {
      body: options?.body,
      headers: options?.headers,
      redirect: options?.redirect,
      additionalDecode: options?.additionalDecode || false,
      proxy: options?.proxy,
      cookies: options?.cookies,
      byteResponse: options?.byteResponse || false,
      hostOverride: options?.hostOverride || null,
      ...options,
    });
  }

  /**
   * The 'execute' method performs a HTTP request of the provided method to the provided URL with the provided options.
   *
   * @param method - The HTTP method of the request.
   * @param url - The URL to perform the request to.
   * @param options - The options for the request.
   *
   * @returns A new Response object.
   */
  protected async execute(
    method: Methods,
    url: string,
    options: RequestOptions
  ) {
    let headers = options?.headers ? options?.headers : this.headers;
    let requestCookies: any = [];

    if (options?.cookies) {
      requestCookies = this.jar.mergeCookies(options.cookies, url);
    }

    let skeletonPayload: any = {
      sessionId: this.sessionId,
      followRedirects: options?.redirect || false,
      forceHttp1: this.forceHttp1,
      withDebug: this.debug,
      headers,
      headerOrder: this.headerOrder,
      insecureSkipVerify: this.insecureSkipVerify,
      additionalDecode: options?.additionalDecode,
      proxyUrl: options?.proxy || this.proxy,
      requestUrl: url,
      requestMethod: method,
      requestBody: options?.body || null,
      requestCookies: requestCookies,
      timeoutMilliseconds: this.timeout || null,
      withRandomTLSExtensionOrder: this.randomTlsExtensionOrder,
      isByteResponse: options?.byteResponse,
      isByteRequest: isByteRequest(headers),
      requestHostOverride: options?.hostOverride,
      disableIPV6: this.disableIPV6,
      disableIPV4: this.disableIPV4,
      isRotatingProxy: options?.isRotatingProxy ?? this.isRotatingProxy,
    };

    if (this.clientIdentifier) {
      skeletonPayload["tlsClientIdentifier"] = this.clientIdentifier;
    } else if (this.ja3string) {
      skeletonPayload["customTlsClient"] = {
        ja3String: this.ja3string,
        h2Settings: this.h2Settings,
        h2SettingsOrder: this.h2SettingsOrder,
        pseudoHeaderOrder: this.pseudoHeaderOrder,
        connectionFlow: this.connectionFlow,
        priorityFrames: this.priorityFrames,
        headerPriority: this.headerPriority,
        certCompressionAlgo: this.certCompressionAlgo,
        supportedVersions: this.supportedVersions,
        supportedSignatureAlgorithms: this.supportedSignatureAlgorithms,
        keyShareCurves: this.keyShareCurves,
        alpnProtocols: this.alpnProtocols,
        alpsProtocols: this.alpsProtocols,
      };
    } else skeletonPayload["tlsClientIdentifier"] = ClientIdentifier.chrome_131;

    const requestPayloadString = JSON.stringify(skeletonPayload);

    let res: TlsResponse = await this.pool?.exec("request", [
      requestPayloadString,
    ]);

    let cookies = this.jar.syncCookies(res?.cookies, url);

    await this.free(res.id);

    return new Response({ ...res, cookies });
  }
}
