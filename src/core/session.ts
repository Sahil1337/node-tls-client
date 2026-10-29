import { randomUUID } from "crypto";
import { Cookies } from "./cookie";
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
import { URL } from "url";
import {
  TlsClientError,
  isByteRequest,
  logger,
  mergeHeaders,
  packageVersion,
  parseNativeId,
} from "../utils";
import { Payload } from "../interface/payload";
import { Client } from "./client";
import { Response } from "./response";

export class Session {
  private static warnedBothTimeouts = false;

  private readonly jar = new Cookies();
  private readonly sessionId: string;
  private closePromise: Promise<string> | null = null;

  constructor(private readonly config: SessionOptions = {}) {
    // Two Session objects with the same id share one native session
    // (cookie jar, connections); close() on either frees it.
    this.sessionId = config.sessionId ?? randomUUID();
  }

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
   * The 'close' method closes the current session (frees native session
   * state). Idempotent: repeated calls return the first result.
   *
   * @returns Native's JSON reply (`{ id, success }`).
   */
  public close(): Promise<string> {
    this.closePromise ??= (async () => {
      const client = Client.getInstance();
      const raw = await client.destroySession(this.sessionId);
      // The reply itself is registered natively under `id` — release it.
      client.freeMemory(parseNativeId(raw));
      return raw;
    })().catch((e) => {
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
    const headers =
      mergeHeaders(this.config.headers, options.headers) ??
      this.getDefaultHeaders();

    const { requestBody, isByte } = Session.encodeBody(options.body);

    const requestCookies = await this.jar.mergeCookies(
      options?.cookies || {},
      url.toString(),
    );

    // Natively, `timeoutMilliseconds` and `timeoutSeconds` both non-zero is a
    // hard error ("cannot build client with both …"); 0 means unset.
    const timeoutMs =
      this.config.timeout !== undefined && this.config.timeout !== 0
        ? this.config.timeout
        : undefined;
    const timeoutSec =
      this.config.timeoutSeconds !== undefined &&
      this.config.timeoutSeconds !== 0
        ? this.config.timeoutSeconds
        : undefined;
    if (
      timeoutMs !== undefined &&
      timeoutSec !== undefined &&
      !Session.warnedBothTimeouts
    ) {
      Session.warnedBothTimeouts = true;
      logger.warn(
        "both `timeout` (ms) and `timeoutSeconds` are set; using `timeout` and ignoring `timeoutSeconds` (native rejects both together).",
      );
    }

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
      requestUrl: url.toString(),
      requestMethod: method,
      requestBody,
      timeoutMilliseconds: timeoutMs ?? 0,
      withRandomTLSExtensionOrder: this.config.randomTlsExtensionOrder ?? false,
      isByteResponse: options?.byteResponse ?? false,
      isByteRequest: isByte || isByteRequest(headers),
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
        options.connectHeaders ?? this.config.connectHeaders ?? {},
      localAddress: this.config.localAddress ?? null,
      withoutCookieJar: this.config.withoutCookieJar ?? false,
      withCustomCookieJar: this.config.withCustomCookieJar ?? false,
      disableHttp3: this.config.disableHttp3 ?? false,
      withProtocolRacing: this.config.withProtocolRacing ?? false,
      disableSessionTickets: this.config.disableSessionTickets ?? false,
      requestCookies,
    };

    // Optional top-level fields: omit when unset so JSON.stringify drops them
    // and native falls back to its zero-value behavior.
    if (this.config.certificatePinningHosts !== undefined)
      payload.certificatePinningHosts = this.config.certificatePinningHosts;
    if (timeoutMs === undefined && timeoutSec !== undefined)
      payload.timeoutSeconds = timeoutSec;

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
        certCompressionAlgos:
          this.config.certCompressionAlgos ??
          (this.config.certCompressionAlgo
            ? [this.config.certCompressionAlgo]
            : ["zlib"]),
        supportedVersions: this.config.supportedVersions ?? [],
        supportedSignatureAlgorithms:
          this.config.supportedSignatureAlgorithms ?? [],
        supportedDelegatedCredentialsAlgorithms:
          this.config.supportedDelegatedCredentialsAlgorithms ?? [],
        keyShareCurves: this.config.keyShareCurves ?? [],
        alpnProtocols: this.config.alpnProtocols ?? [],
        alpsProtocols: this.config.alpsProtocols ?? [],
        h3Settings: this.config.h3Settings ?? {},
        h3SettingsOrder: this.config.h3SettingsOrder ?? [],
        h3PseudoHeaderOrder: this.config.h3PseudoHeaderOrder ?? [],
        h3PriorityParam: this.config.h3PriorityParam ?? 0,
        h3SendGreaseFrames: this.config.h3SendGreaseFrames ?? false,
        ECHCandidatePayloads: this.config.echCandidatePayloads ?? [],
        ECHCandidateCipherSuites: this.config.echCandidateCipherSuites ?? [],
        recordSizeLimit: this.config.recordSizeLimit ?? 0,
        streamId: this.config.streamId ?? 0,
        allowHttp: this.config.allowHttp ?? false,
      };
      // Unset keeps 2.1.0's wire behavior (a zeroed priority is applied);
      // `null` omits the field so native treats it as nil/unset.
      if (this.config.headerPriority !== null)
        payload.customTlsClient.headerPriority = this.config.headerPriority ?? {
          streamDep: 0,
          exclusive: false,
          weight: 0,
        };
      if (this.config.trustAnchorsPayload !== undefined)
        payload.customTlsClient.trustAnchorsPayload =
          this.config.trustAnchorsPayload;
    } else payload["tlsClientIdentifier"] = ClientIdentifier.chrome_150;

    const client = Client.getInstance();
    const rawResponse = await client.request(payload);

    const response: TlsResponse = JSON.parse(rawResponse);
    // The JSON is copied into JS; release native's copy right away.
    if (response.id) client.freeMemory(response.id);

    const cookies = await this.jar.syncCookies(
      response.cookies || {},
      url.toString(),
    );

    return new Response({ ...response, cookies });
  }

  /** Body → native `requestBody` (`*string`) + whether it is base64 bytes. */
  private static encodeBody(body: RequestOptions["body"]): {
    requestBody: string | null;
    isByte: boolean;
  } {
    if (body === undefined || body === null || body === "") {
      return { requestBody: null, isByte: false };
    }
    if (typeof body === "string") return { requestBody: body, isByte: false };
    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
      return {
        requestBody: Buffer.from(body).toString("base64"),
        isByte: true,
      };
    }
    throw new TlsClientError(
      "body must be a string or Buffer; JSON.stringify objects before sending",
    );
  }

  private getDefaultHeaders(): Record<string, string> {
    return {
      "User-Agent": `tls-client/${packageVersion}`,
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
      Connection: "keep-alive",
    };
  }
}
