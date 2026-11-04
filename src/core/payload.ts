import { ClientIdentifier } from "../types/client-identifier";
import { H2Settings } from "../types/fingerprint";
import { CustomTlsClient, Payload } from "../types/payload";
import { Methods, RequestOptions } from "../types/request";
import { SessionOptions } from "../types/session";
import {
  TlsClientError,
  isByteRequest,
  logger,
  mergeHeaders,
  packageVersion,
} from "../utils";

/** Sent when neither the session nor the request supplies a headers object. */
const DEFAULT_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "User-Agent": `tls-client/${packageVersion}`,
  "Accept-Encoding": "gzip, deflate, br",
  Accept: "*/*",
  Connection: "keep-alive",
});

export interface PayloadInput {
  sessionId: string;
  session: SessionOptions;
  method: Methods;
  url: string;
  request: RequestOptions;
}

/** Maps session + request options onto native's `RequestInput`. */
export function buildPayload({
  sessionId,
  session,
  method,
  url,
  request,
}: PayloadInput): Payload {
  const headers =
    mergeHeaders(session.headers, request.headers) ?? DEFAULT_HEADERS;
  const { requestBody, isByte } = encodeBody(request.body);
  const { timeoutMilliseconds, timeoutSeconds } = resolveTimeouts(session);

  const payload: Payload = {
    sessionId,
    followRedirects: request.followRedirects ?? false,
    forceHttp1: session.forceHttp1 ?? false,
    withDebug: session.debug ?? false,
    headers,
    headerOrder: request.headerOrder || session.headerOrder || [],
    insecureSkipVerify: session.insecureSkipVerify ?? false,
    proxyUrl: request.proxy || session.proxy || "",
    isRotatingProxy:
      request.isRotatingProxy ?? session.isRotatingProxy ?? false,
    requestUrl: url,
    requestMethod: method,
    requestBody,
    timeoutMilliseconds,
    withRandomTLSExtensionOrder: session.randomTlsExtensionOrder ?? false,
    isByteResponse: request.byteResponse ?? false,
    isByteRequest: isByte || isByteRequest(headers),
    requestHostOverride: request.hostOverride || null,
    disableIPV6: session.disableIPV6 ?? false,
    disableIPV4: session.disableIPV4 ?? false,
    transportOptions: session.transportOptions,
    catchPanics: false,
    streamOutputEOFSymbol: session.streamOutputEOFSymbol ?? null,
    streamOutputPath: session.streamOutputPath ?? null,
    streamOutputBlockSize: session.streamOutputBlockSize ?? null,
    serverNameOverwrite: session.serverNameOverwrite ?? "",
    connectHeaders: request.connectHeaders ?? session.connectHeaders ?? {},
    localAddress: session.localAddress ?? null,
    withoutCookieJar: session.withoutCookieJar ?? false,
    withCustomCookieJar: session.withCustomCookieJar ?? false,
    disableHttp3: session.disableHttp3 ?? false,
    withProtocolRacing: session.withProtocolRacing ?? false,
    disableSessionTickets: session.disableSessionTickets ?? false,
    // Values verbatim: a Set-Cookie parser would cut a value at the first `;`.
    requestCookies: Object.entries(request.cookies ?? {}).map(
      ([name, value]) => ({ name, value: String(value) }),
    ),
  };

  // Optional top-level fields: omit when unset so JSON.stringify drops them
  // and native falls back to its zero-value behavior.
  if (session.certificatePinningHosts !== undefined)
    payload.certificatePinningHosts = session.certificatePinningHosts;
  if (timeoutSeconds !== undefined) payload.timeoutSeconds = timeoutSeconds;

  if (session.clientIdentifier) {
    payload.tlsClientIdentifier = session.clientIdentifier;
  } else if (session.ja3string) {
    payload.customTlsClient = customTlsClient(session.ja3string, session);
  } else {
    payload.tlsClientIdentifier = ClientIdentifier.chrome_150;
  }
  return payload;
}

function customTlsClient(
  ja3String: string,
  session: SessionOptions,
): CustomTlsClient {
  const custom: CustomTlsClient = {
    ja3String,
    h2Settings: numericH2Settings(session.h2Settings),
    h2SettingsOrder: session.h2SettingsOrder ?? [],
    pseudoHeaderOrder: session.pseudoHeaderOrder ?? [],
    connectionFlow: session.connectionFlow ?? 0,
    priorityFrames: session.priorityFrames ?? [],
    certCompressionAlgos:
      session.certCompressionAlgos ??
      (session.certCompressionAlgo ? [session.certCompressionAlgo] : ["zlib"]),
    supportedVersions: session.supportedVersions ?? [],
    supportedSignatureAlgorithms: session.supportedSignatureAlgorithms ?? [],
    supportedDelegatedCredentialsAlgorithms:
      session.supportedDelegatedCredentialsAlgorithms ?? [],
    keyShareCurves: session.keyShareCurves ?? [],
    alpnProtocols: session.alpnProtocols ?? [],
    alpsProtocols: session.alpsProtocols ?? [],
    h3Settings: session.h3Settings ?? {},
    h3SettingsOrder: session.h3SettingsOrder ?? [],
    h3PseudoHeaderOrder: session.h3PseudoHeaderOrder ?? [],
    h3PriorityParam: session.h3PriorityParam ?? 0,
    h3SendGreaseFrames: session.h3SendGreaseFrames ?? false,
    ECHCandidatePayloads: session.echCandidatePayloads ?? [],
    ECHCandidateCipherSuites: session.echCandidateCipherSuites ?? [],
    recordSizeLimit: session.recordSizeLimit ?? 0,
    streamId: session.streamId ?? 0,
    allowHttp: session.allowHttp ?? false,
  };
  // Unset keeps 2.1.0's wire behavior (a zeroed priority is applied);
  // `null` omits the field so native treats it as nil/unset.
  if (session.headerPriority !== null)
    custom.headerPriority = session.headerPriority ?? {
      streamDep: 0,
      exclusive: false,
      weight: 0,
    };
  if (session.trustAnchorsPayload !== undefined)
    custom.trustAnchorsPayload = session.trustAnchorsPayload;
  return custom;
}

/** Booleans become `1`/`0`: native rejects them (2.1.0 typed `ENABLE_PUSH` as a boolean). */
function numericH2Settings(
  settings: H2Settings = {},
): CustomTlsClient["h2Settings"] {
  const { ENABLE_PUSH } = settings;
  if (typeof ENABLE_PUSH !== "boolean") {
    return settings as CustomTlsClient["h2Settings"];
  }
  return { ...settings, ENABLE_PUSH: Number(ENABLE_PUSH) };
}

/**
 * Natively, `timeoutMilliseconds` and `timeoutSeconds` both non-zero is a
 * hard error ("cannot build client with both …"); 0 means unset. When both
 * are given, `timeout` (ms) wins.
 */
function resolveTimeouts({ timeout, timeoutSeconds }: SessionOptions): {
  timeoutMilliseconds: number;
  timeoutSeconds?: number;
} {
  if (!timeout) {
    return {
      timeoutMilliseconds: 0,
      timeoutSeconds: timeoutSeconds || undefined,
    };
  }
  if (timeoutSeconds) {
    logger.warnOnce(
      "both-timeouts",
      "both `timeout` (ms) and `timeoutSeconds` are set; using `timeout` and ignoring `timeoutSeconds` (native rejects both together).",
    );
  }
  return { timeoutMilliseconds: timeout };
}

/** Body → native `requestBody` (`*string`) + whether it is base64 bytes. */
function encodeBody(body: RequestOptions["body"]): {
  requestBody: string | null;
  isByte: boolean;
} {
  if (body === undefined || body === null || body === "") {
    return { requestBody: null, isByte: false };
  }
  if (typeof body === "string") return { requestBody: body, isByte: false };
  if (body instanceof Uint8Array) {
    // A Buffer view over the same memory: base64-encodes without copying.
    const bytes = Buffer.isBuffer(body)
      ? body
      : Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    return { requestBody: bytes.toString("base64"), isByte: true };
  }
  throw new TlsClientError(
    "body must be a string or Buffer; JSON.stringify objects before sending",
  );
}
