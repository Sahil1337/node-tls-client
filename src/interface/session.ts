import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";

/**
 * Headers as accepted by `SessionOptions.headers`, request options and
 * `fetch()`. A superset of Node's `OutgoingHttpHeaders`: numbers are sent as
 * strings, arrays joined with `", "`, and `null`/`undefined` REMOVES the header
 * (useful per request to drop a session header).
 */
export type HeaderInput = Record<
  string,
  string | number | readonly string[] | null | undefined
>;

/**
 * How per-request `headers` combine with session `headers`.
 * - `"merge"` (default): request headers layer over session headers per key,
 *   case-insensitively; the request's value and casing win.
 * - `"replace"`: 2.1.0 behavior — request headers, when given, replace the
 *   session headers entirely.
 */
export type HeaderMode = "merge" | "replace";

/**
 * Represents various settings for HTTP/2 (h2) protocol.
 */
export interface H2Settings {
  /**
   * The size of the header compression table used in HTTP/2.
   */
  HEADER_TABLE_SIZE?: number;

  /**
   * Indicates whether server push is enabled in HTTP/2 (`1`/`0` — the native
   * settings map is numeric; booleans are rejected).
   */
  ENABLE_PUSH?: number;

  /**
   * The maximum number of concurrent streams allowed in HTTP/2.
   */
  MAX_CONCURRENT_STREAMS?: number;

  /**
   * The initial window size for HTTP/2 data frames.
   */
  INITIAL_WINDOW_SIZE?: number;

  /**
   * The maximum size of HTTP/2 frames.
   */
  MAX_FRAME_SIZE?: number;

  /**
   * The maximum size of header list in HTTP/2.
   */
  MAX_HEADER_LIST_SIZE?: number;
}

/**
 * Represents various supported signature algorithms for TLS.
 */
export type SupportedSignatureAlgorithms =
  | "PKCS1WithSHA256"
  | "PKCS1WithSHA384"
  | "PKCS1WithSHA512"
  | "PSSWithSHA256"
  | "PSSWithSHA384"
  | "PSSWithSHA512"
  | "ECDSAWithP256AndSHA256"
  | "ECDSAWithP384AndSHA384"
  | "ECDSAWithP521AndSHA512"
  | "SHA224_RSA"
  | "SHA224_ECDSA"
  | "PKCS1WithSHA1"
  | "ECDSAWithSHA1"
  | "Ed25519"
  | "MLDSA44"
  | "MLDSA65"
  | "MLDSA87"
  | "GREASE";

/**
 * Represents supported delegated credentials algorithms for TLS.
 */
export type SupportedDelegatedCredentialsAlgorithms =
  | "PKCS1WithSHA256"
  | "PKCS1WithSHA384"
  | "PKCS1WithSHA512"
  | "PSSWithSHA256"
  | "PSSWithSHA384"
  | "PSSWithSHA512"
  | "ECDSAWithP256AndSHA256"
  | "ECDSAWithP384AndSHA384"
  | "ECDSAWithP521AndSHA512"
  | "SHA224_RSA"
  | "SHA224_ECDSA"
  | "PKCS1WithSHA1"
  | "ECDSAWithSHA1"
  | "Ed25519";

/**
 * Represents various supported versions of TLS.
 */
export type SupportedVersions = "GREASE" | "1.3" | "1.2" | "1.1" | "1.0";

/**
 * Represents various supported elliptic curves for key exchange.
 */
export type KeyShareCurves =
  | "GREASE"
  | "P256"
  | "P384"
  | "P521"
  | "X25519"
  | "P256Kyber768"
  | "X25519Kyber512D"
  | "X25519Kyber768"
  | "X25519Kyber768Old"
  | "X25519MLKEM768";

/**
 * Represents various certificate compression algorithms.
 */
export type CertCompressionAlgo = "zlib" | "brotli" | "zstd";

/**
 * Represents HTTP/3 (h3) protocol settings. Keys mirror the native string-keyed
 * `H3SettingsMap` — do NOT use the uint-keyed `http3Settings` form.
 */
export interface H3Settings {
  QPACK_MAX_TABLE_CAPACITY?: number;
  MAX_FIELD_SECTION_SIZE?: number;
  QPACK_BLOCKED_STREAMS?: number;
  H3_DATAGRAM?: number;
}

/**
 * ECH HPKE key derivation function identifiers.
 */
export type KdfId = "HKDF_SHA256" | "HKDF_SHA384" | "HKDF_SHA512";

/**
 * ECH HPKE AEAD identifiers.
 */
export type AeadId =
  "AEAD_AES_128_GCM" | "AEAD_AES_256_GCM" | "AEAD_CHACHA20_POLY1305";

/**
 * A candidate cipher suite for Encrypted Client Hello (ECH).
 */
export interface CandidateCipherSuite {
  kdfId: KdfId;
  aeadId: AeadId;
}

/**
 * Represents parameters for setting priority of HTTP/2 streams.
 */
export interface PriorityParam {
  /**
   * The stream dependency for priority.
   */
  streamDep: number;
  /**
   * Indicates whether the priority is exclusive.
   */
  exclusive: boolean;
  /**
   * The weight of the priority.
   */
  weight: number;
}

/**
 * Represents priority frames for HTTP/2 streams.
 */
export interface PriorityFrames {
  /**
   * The stream ID for which priority is set.
   */
  streamID: number;
  /**
   * The parameters for priority settings.
   */
  priorityParam: PriorityParam;
}

/**
 * Represents the order of pseudo headers in HTTP/2 requests.
 */
export type PseudoHeaderOrder = ":method" | ":authority" | ":scheme" | ":path";

/**
 * Represents various HTTP methods.
 */
export type Methods =
  "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

/**
 * Represents various client identifiers.
 *
 * The client identifiers are grouped by browser, mobile clients, and other clients.
 */
export enum ClientIdentifier {
  // Chrome versions
  chrome_103 = "chrome_103",
  chrome_104 = "chrome_104",
  chrome_105 = "chrome_105",
  chrome_106 = "chrome_106",
  chrome_107 = "chrome_107",
  chrome_108 = "chrome_108",
  chrome_109 = "chrome_109",
  chrome_110 = "chrome_110",
  chrome_111 = "chrome_111",
  chrome_112 = "chrome_112",
  chrome_116_PSK = "chrome_116_PSK",
  chrome_116_PSK_PQ = "chrome_116_PSK_PQ",
  chrome_117 = "chrome_117",
  chrome_120 = "chrome_120",
  chrome_124 = "chrome_124",
  chrome_131 = "chrome_131",
  chrome_131_psk = "chrome_131_PSK",
  chrome_130_psk = "chrome_130_PSK",
  chrome_133 = "chrome_133",
  chrome_133_psk = "chrome_133_PSK",
  chrome_144 = "chrome_144",
  chrome_144_psk = "chrome_144_PSK",
  chrome_146 = "chrome_146",
  chrome_146_psk = "chrome_146_PSK",
  chrome_150 = "chrome_150",
  chrome_150_psk = "chrome_150_PSK",
  chrome_152 = "chrome_152",
  chrome_152_psk = "chrome_152_PSK",

  // Brave versions
  brave_146 = "brave_146",
  brave_146_psk = "brave_146_PSK",

  // Safari versions
  safari_15_6_1 = "safari_15_6_1",
  safari_16_0 = "safari_16_0",
  safari_ipad_15_6 = "safari_ipad_15_6",
  safari_ios_15_5 = "safari_ios_15_5",
  safari_ios_15_6 = "safari_ios_15_6",
  safari_ios_16_0 = "safari_ios_16_0",
  safari_ios_17_0 = "safari_ios_17_0",
  safari_ios_18_0 = "safari_ios_18_0",
  safari_ios_18_5 = "safari_ios_18_5",
  safari_ios_26_0 = "safari_ios_26_0",

  // Firefox versions
  firefox_102 = "firefox_102",
  firefox_104 = "firefox_104",
  firefox_105 = "firefox_105",
  firefox_106 = "firefox_106",
  firefox_108 = "firefox_108",
  firefox_110 = "firefox_110",
  firefox_117 = "firefox_117",
  firefox_120 = "firefox_120",
  firefox_123 = "firefox_123",
  firefox_132 = "firefox_132",
  firefox_133 = "firefox_133",
  firefox_135 = "firefox_135",
  firefox_146_psk = "firefox_146_PSK",
  firefox_147 = "firefox_147",
  firefox_147_psk = "firefox_147_PSK",
  firefox_148 = "firefox_148",

  // Opera versions
  opera_89 = "opera_89",
  opera_90 = "opera_90",
  opera_91 = "opera_91",

  // Zalando mobile clients
  zalando_android_mobile = "zalando_android_mobile",
  zalando_ios_mobile = "zalando_ios_mobile",

  // Nike mobile clients
  nike_ios_mobile = "nike_ios_mobile",
  nike_android_mobile = "nike_android_mobile",

  // Other clients
  cloudscraper = "cloudscraper",

  // MMS iOS versions
  mms_ios = "mms_ios",
  mms_ios_1 = "mms_ios_1",
  mms_ios_2 = "mms_ios_2",
  mms_ios_3 = "mms_ios_3",

  // Mesh clients
  mesh_ios = "mesh_ios",
  mesh_ios_1 = "mesh_ios_1",
  mesh_ios_2 = "mesh_ios_2",
  mesh_android = "mesh_android",
  mesh_android_1 = "mesh_android_1",
  mesh_android_2 = "mesh_android_2",

  // Confirmed clients
  confirmed_ios = "confirmed_ios",
  confirmed_android = "confirmed_android",

  // OkHttp Android versions
  okhttp4_android_7 = "okhttp4_android_7",
  okhttp4_android_8 = "okhttp4_android_8",
  okhttp4_android_9 = "okhttp4_android_9",
  okhttp4_android_10 = "okhttp4_android_10",
  okhttp4_android_11 = "okhttp4_android_11",
  okhttp4_android_12 = "okhttp4_android_12",
  okhttp4_android_13 = "okhttp4_android_13",
}

/**
 * Represents options for creating a session.
 */
export interface SessionOptions {
  /**
   * Identifier of the native session (cookie jar + connection pool). Random
   * when omitted. Two `Session` objects with the same id share one native
   * session; `close()` on either frees it.
   */
  sessionId?: string;

  /**
   * Default headers for every request of this session. Per-request `headers`
   * layer over them (see {@link HeaderMode}). When neither the session nor the
   * request provides headers, a small built-in set is sent.
   */
  headers?: HeaderInput;

  /**
   * How per-request `headers` combine with these session headers.
   * Default `"merge"`; use `"replace"` for the pre-2.2.0 behavior.
   */
  headerMode?: HeaderMode;

  /**
   * The headers for the connect request.
   */
  connectHeaders?: Record<string, string[]>;

  /**
   * The proxy server to use for the session.
   */
  proxy?: string;

  /**
   * Whether the proxy is rotating proxy.
   */
  isRotatingProxy?: boolean;

  /**
   * The client identifier for the session.
   */
  clientIdentifier?: ClientIdentifier;

  /**
   * The JA3 string for the session.
   */
  ja3string?: string;

  /**
   * The settings for HTTP/2.
   */
  h2Settings?: H2Settings;

  /**
   * The order of HTTP/2 settings.
   */
  h2SettingsOrder?: (keyof H2Settings)[];

  /**
   * The supported signature algorithms.
   */
  supportedSignatureAlgorithms?: SupportedSignatureAlgorithms[];

  /**
   * The server name to overwrite.
   */
  serverNameOverwrite?: string;

  /**
   * The block size for the stream output.
   */
  streamOutputBlockSize?: number;

  /**
   * The symbol to use for the stream output.
   */
  streamOutputEOFSymbol?: string;

  /**
   * The path for the stream output.
   */
  streamOutputPath?: string;

  /**
   * The local address for the session.
   */
  localAddress?: string;

  /**
   * The supported versions of TLS.
   */
  supportedVersions?: SupportedVersions[];

  /**
   * The supported elliptic curves for key exchange.
   */
  keyShareCurves?: KeyShareCurves[];

  /**
   * The certificate compression algorithms.
   */
  certCompressionAlgos?: CertCompressionAlgo[];

  /**
   * @deprecated Use `certCompressionAlgos` (array) instead. Kept for backward
   * compatibility — a single value is wrapped into an array automatically.
   */
  certCompressionAlgo?: CertCompressionAlgo;

  /**
   * The order of pseudo headers.
   */
  pseudoHeaderOrder?: PseudoHeaderOrder[];

  /**
   * The connection flow for the session.
   */
  connectionFlow?: number;

  /**
   * The transport options for the session.
   */
  transportOptions?: TransportOptions;

  /**
   * The priority frames for HTTP/2 streams.
   */
  priorityFrames?: PriorityFrames[];

  /**
   * The order of headers (header names, lower-case recommended; matched
   * case-insensitively natively).
   */
  headerOrder?: string[] | OutgoingHttpHeaders[];

  /**
   * The ALPN protocols.
   */
  alpnProtocols?: string[];

  /**
   * The ALPS protocols.
   */
  alpsProtocols?: string[];

  /**
   * HTTP/2 priority applied to header frames (ja3string path). When omitted a
   * zeroed priority (`{ streamDep: 0, exclusive: false, weight: 0 }`) is sent,
   * as in earlier versions; pass `null` to send no priority at all.
   */
  headerPriority?: PriorityParam | null;

  /**
   * Whether to randomize TLS extension order.
   */
  randomTlsExtensionOrder?: boolean;

  /**
   * Whether to force HTTP/1 protocol.
   */
  forceHttp1?: boolean;

  /**
   * Whether to enable debugging.
   */
  debug?: boolean;

  /**
   * Whether to skip SSL certificate verification.
   */
  insecureSkipVerify?: boolean;

  /**
   * The timeout duration for each request, in milliseconds.
   */
  timeout?: number;

  /**
   * If true, IPv4 is disabled for the session requests.
   */
  disableIPV4?: boolean;

  /**
   * If true, IPv6 is disabled for the session requests.
   */
  disableIPV6?: boolean;

  /**
   * If true, disables HTTP/3 (QUIC) for the session requests.
   */
  disableHttp3?: boolean;

  /**
   * If true, enables protocol racing (HTTP/2 vs HTTP/3). Since tls-client
   * 1.16.0 this is rejected with a config error (request `status: 0`) when
   * combined with a non-SOCKS5 proxy, because only SOCKS5 can tunnel UDP.
   */
  withProtocolRacing?: boolean;

  /**
   * If true, disables TLS session ticket caching and resumption.
   *
   * Needs a tls-client build newer than the 1.16.0 release binaries, which
   * predate this field and silently ignore it.
   */
  disableSessionTickets?: boolean;

  /**
   * If true, uses tls-client's custom cookie jar natively instead of Go's
   * default one. Cookie persistence between requests is native's job either
   * way; `session.cookies()` reads a JS-side mirror.
   */
  withCustomCookieJar?: boolean;

  /**
   * If true, disables the native session cookie jar: cookies set by a
   * response are no longer sent on later requests (only per-request
   * `cookies` are). `session.cookies()` still reports what was seen.
   */
  withoutCookieJar?: boolean;

  /**
   * Certificate pinning hosts, mapping a host to an array of pinned
   * certificate fingerprints.
   */
  certificatePinningHosts?: Record<string, string[]>;

  /**
   * The timeout duration for each request, in seconds. Only sent when
   * `timeout` (ms) is unset or `0`: natively, setting BOTH is a hard error, so
   * when both are given this wrapper keeps `timeout` and warns once.
   */
  timeoutSeconds?: number;

  /**
   * HTTP/3 settings. Only applied on the custom-client (ja3string) path.
   */
  h3Settings?: H3Settings;

  /**
   * The order of HTTP/3 settings. Only applied on the ja3string path.
   */
  h3SettingsOrder?: (keyof H3Settings)[];

  /**
   * The order of HTTP/3 pseudo headers. Only applied on the ja3string path.
   */
  h3PseudoHeaderOrder?: PseudoHeaderOrder[];

  /**
   * The HTTP/3 priority param. Only applied on the ja3string path.
   */
  h3PriorityParam?: number;

  /**
   * Whether to send HTTP/3 grease frames. Only applied on the ja3string path.
   */
  h3SendGreaseFrames?: boolean;

  /**
   * ECH candidate payloads. Only applied on the ja3string path.
   */
  echCandidatePayloads?: number[];

  /**
   * ECH candidate cipher suites. Only applied on the ja3string path.
   */
  echCandidateCipherSuites?: CandidateCipherSuite[];

  /**
   * The TLS record size limit. Only applied on the ja3string path.
   */
  recordSizeLimit?: number;

  /**
   * The stream ID. Only applied on the ja3string path.
   */
  streamId?: number;

  /**
   * Whether to allow plain HTTP. Only applied on the ja3string path.
   */
  allowHttp?: boolean;

  /**
   * The supported delegated credentials algorithms. Only applied on the
   * ja3string path.
   */
  supportedDelegatedCredentialsAlgorithms?: SupportedDelegatedCredentialsAlgorithms[];

  /**
   * Trust-anchors extension payload; required when the `ja3string` lists
   * extension 51764. Only applied on the ja3string path.
   *
   * Needs a tls-client build newer than the 1.16.0 release binaries, which
   * predate this field and silently ignore it.
   */
  trustAnchorsPayload?: string;
}

/**
 * Represents base options for making HTTP requests, excluding the body.
 */
export interface BaseRequestOptions {
  /**
   * The headers for the request. Layered over the session headers (see
   * {@link HeaderMode}); a `null`/`undefined` value removes a session header.
   */
  headers?: HeaderInput;

  /**
   * The headers for the connect request.
   */
  connectHeaders?: Record<string, string[]>;

  /**
   * The order of headers.
   */
  headerOrder?: string[] | OutgoingHttpHeaders[];

  /**
   * Whether to follow redirects.
   */
  followRedirects?: boolean;

  /**
   * The proxy server to use for the request.
   */
  proxy?: string;

  /**
   * Whether proxy is rotating proxy or not.
   */
  isRotatingProxy?: boolean;

  /**
   * Cookies for the request.
   */
  cookies?: Record<string, string | number>;

  /**
   * If true, indicates the response is in binary format, like base64-encoded images.
   */
  byteResponse?: boolean;

  /**
   * Used to override the Host header, typically needed when making requests directly to an IP address.
   */
  hostOverride?: string | null;
}

/**
 * Transport-level options for HTTP requests.
 *
 * These options control connection reuse, compression, buffer sizes, and other low-level transport behaviors.
 */
export interface TransportOptions {
  /**
   * If true, disables HTTP keep-alive connections.
   */
  disableKeepAlives: boolean;
  /**
   * If true, disables automatic response decompression (gzip, deflate, etc.).
   */
  disableCompression: boolean;
  /**
   * The maximum number of idle (keep-alive) connections across all hosts.
   */
  maxIdleConns: number;
  /**
   * The maximum number of idle (keep-alive) connections to keep per-host.
   */
  maxIdleConnsPerHost: number;
  /**
   * The maximum number of total connections per host (idle + active).
   */
  maxConnsPerHost: number;
  /**
   * The maximum number of bytes allowed in response headers. If zero, a default is used.
   */
  maxResponseHeaderBytes: number;
  /**
   * The size of the write buffer in bytes. If zero, a default (typically 4KB) is used.
   */
  writeBufferSize: number;
  /**
   * The size of the read buffer in bytes. If zero, a default (typically 4KB) is used.
   */
  readBufferSize: number;
  /**
   * The maximum idle connection timeout, in nanoseconds.
   */
  idleConnTimeout: number;
}

/**
 * Represents options for making HTTP requests that may include a body.
 */
export interface RequestOptions extends BaseRequestOptions {
  /**
   * Request body: a string, or a `Buffer`/`Uint8Array` (sent base64-encoded as
   * a byte request). Objects are rejected — `JSON.stringify` them first.
   */
  body?: string | Buffer | Uint8Array | null;
}

/**
 * Represents options for making a GET HTTP request.
 */
export interface GetRequestOptions extends BaseRequestOptions {}

/**
 * Represents options for making a POST HTTP request.
 */
export interface PostRequestOptions extends RequestOptions {}

/**
 * Represents options for making a PUT HTTP request.
 */
export interface PutRequestOptions extends RequestOptions {}

/**
 * Represents options for making a DELETE HTTP request.
 */
export interface DeleteRequestOptions extends BaseRequestOptions {}

/**
 * Represents options for making a PATCH HTTP request.
 */
export interface PatchRequestOptions extends RequestOptions {}

/**
 * Represents options for making an OPTIONS HTTP request.
 */
export interface OptionsRequestOptions extends BaseRequestOptions {}

/**
 * Represents options for making a HEAD HTTP request.
 */
export interface HeadRequestOptions extends BaseRequestOptions {}

/**
 *  Represents options for making HTTP requests.
 */
export interface fetchOptions {
  /**
   * Request method.
   */
  method?: Methods;

  /**
   * The headers for the request.
   */
  headers?: HeaderInput;

  /**
   * The body of the request (string, or Buffer for binary payloads).
   */
  body?: string | Buffer | Uint8Array | null;

  /**
   * Whether to follow redirects.
   */
  followRedirects?: boolean;

  /**
   * The proxy server to use for the request.
   */
  proxy?: string;

  /**
   * Whether proxy is rotating proxy or not.
   */
  isRotatingProxy?: boolean;

  /**
   * Cookies for the request.
   */
  cookies?: Record<string, string | number>;

  /**
   * Additional session options.
   */
  options?: SessionOptions;
}

/**
 * Represents a response from the shared library.
 */
export interface TlsResponse {
  /**
   * The unique identifier for the response.
   */
  id: string;

  /**
   * The body of the response.
   */
  body: string;

  /**
   * Cookies set in the response.
   */
  cookies: Record<string, string>;

  /**
   * Headers included in the response. Note: at runtime every value is a
   * `string[]` (native returns `map[string][]string`).
   */
  headers: IncomingHttpHeaders;

  /**
   * The session ID associated with the response.
   */
  sessionId: string;

  /**
   * The HTTP status code of the response.
   */
  status: number;

  /**
   * The target URL of the response.
   */
  target: string;

  /**
   * The protocol used for the response.
   */
  usedProtocol: string;
}
