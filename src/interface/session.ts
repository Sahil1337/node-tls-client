import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";

/**
 * Represents various settings for HTTP/2 (h2) protocol.
 */
export interface H2Settings {
  /**
   * The size of the header compression table used in HTTP/2.
   */
  HEADER_TABLE_SIZE?: number;

  /**
   * Indicates whether server push is enabled in HTTP/2.
   */
  ENABLE_PUSH?: boolean;

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
  | "X25519Kyber768";

/**
 * Represents various certificate compression algorithms.
 */
export type CertCompressionAlgo = "zlib" | "brotli" | "zstd";

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
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

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

  // Safari versions
  safari_15_6_1 = "safari_15_6_1",
  safari_16_0 = "safari_16_0",
  safari_ipad_15_6 = "safari_ipad_15_6",
  safari_ios_15_5 = "safari_ios_15_5",
  safari_ios_15_6 = "safari_ios_15_6",
  safari_ios_16_0 = "safari_ios_16_0",
  safari_ios_17_0 = "safari_ios_17_0",
  safari_ios_18_0 = "safari_ios_18_0",

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
   * The unique identifier for the session.
   */
  sessionId?: string;

  /**
   * The headers for the session.
   */
  headers?: OutgoingHttpHeaders;

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
   * The supported versions of TLS.
   */
  supportedVersions?: SupportedVersions[];

  /**
   * The supported elliptic curves for key exchange.
   */
  keyShareCurves?: KeyShareCurves[];

  /**
   * The certificate compression algorithm.
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
   * The priority frames for HTTP/2 streams.
   */
  priorityFrames?: PriorityFrames[];

  /**
   * The order of headers.
   */
  headerOrder?: string[];

  /**
   * The ALPN protocols.
   */
  alpnProtocols?: string[];

  /**
   * The ALPS protocols.
   */
  alpsProtocols?: string[];

  /**
   * The priority of headers.
   */
  headerPriority?: PriorityParam;

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
}

/**
 * Represents base options for making HTTP requests, excluding the body.
 */
export interface BaseRequestOptions {
  /**
   * The headers for the request.
   */
  headers?: OutgoingHttpHeaders;

  /**
   * Whether to follow redirects.
   */
  redirect?: boolean;

  /**
   * Whether to perform additional decoding.
   */
  additionalDecode?: boolean;

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
  cookies?: Record<string, any>;

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
 * Represents options for making HTTP requests that may include a body.
 */
export interface RequestOptions extends BaseRequestOptions {
  /**
   * Request body.
   */
  body?: any;
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
  headers?: OutgoingHttpHeaders;

  /**
   * The body of the request.
   */
  body?: any;

  /**
   * Whether to follow redirects.
   */
  redirect?: boolean;

  /**
   * Whether to perform additional decoding.
   */
  additionalDecode?: boolean;

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
  cookies?: Record<string, any>;

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
   * Headers included in the response.
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
