import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";

/**
 * Represents various settings for HTTP/2 (h2) protocol.
 */
export interface H2Settings {
  HEADER_TABLE_SIZE?: number; // The size of the header compression table used in HTTP/2.
  ENABLE_PUSH?: boolean; // Indicates whether server push is enabled in HTTP/2.
  MAX_CONCURRENT_STREAMS?: number; // The maximum number of concurrent streams allowed in HTTP/2.
  INITIAL_WINDOW_SIZE?: number; // The initial window size for HTTP/2 data frames.
  MAX_FRAME_SIZE?: number; // The maximum size of HTTP/2 frames.
  MAX_HEADER_LIST_SIZE?: number; // The maximum size of header list in HTTP/2.
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
  streamDep: number; // The stream dependency for priority.
  exclusive: boolean; // Indicates whether the priority is exclusive.
  weight: number; // The weight of the priority.
}

/**
 * Represents priority frames for HTTP/2 streams.
 */
export interface PriorityFrames {
  streamID: number; // The stream ID for which priority is set.
  priorityParam: PriorityParam; // The parameters for priority settings.
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
export type ClientIdentifier =
  // Chrome versions
  | "chrome_103"
  | "chrome_104"
  | "chrome_105"
  | "chrome_106"
  | "chrome_107"
  | "chrome_108"
  | "chrome_109"
  | "chrome_110"
  | "chrome_111"
  | "chrome_112"
  | "chrome_116_PSK"
  | "chrome_116_PSK_PQ"
  | "chrome_117"
  | "chrome_120"
  | "chrome_124"

  // Safari versions
  | "safari_15_6_1"
  | "safari_16_0"
  | "safari_ipad_15_6"
  | "safari_ios_15_5"
  | "safari_ios_15_6"
  | "safari_ios_16_0"
  | "safari_ios_17_0"

  // Firefox versions
  | "firefox_102"
  | "firefox_104"
  | "firefox_105"
  | "firefox_106"
  | "firefox_108"
  | "firefox_110"
  | "firefox_117"
  | "firefox_120"
  | "firefox_123"

  // Opera versions
  | "opera_89"
  | "opera_90"
  | "opera_91"

  // Zalando mobile clients
  | "zalando_android_mobile"
  | "zalando_ios_mobile"

  // Nike mobile clients
  | "nike_ios_mobile"
  | "nike_android_mobile"

  // Other clients
  | "cloudscraper"

  // MMS iOS versions
  | "mms_ios"
  | "mms_ios_1"
  | "mms_ios_2"
  | "mms_ios_3"

  // Mesh clients
  | "mesh_ios"
  | "mesh_ios_1"
  | "mesh_ios_2"
  | "mesh_android"
  | "mesh_android_1"
  | "mesh_android_2"

  // Confirmed clients
  | "confirmed_ios"
  | "confirmed_android"

  // OkHttp Android versions
  | "okhttp4_android_7"
  | "okhttp4_android_8"
  | "okhttp4_android_9"
  | "okhttp4_android_10"
  | "okhttp4_android_11"
  | "okhttp4_android_12"
  | "okhttp4_android_13";

/**
 * Represents options for creating a session.
 */
export interface SessionOptions {
  sessionId?: string; // The unique identifier for the session.
  headers?: OutgoingHttpHeaders; // The headers for the session.
  proxy?: string; // The proxy server to use for the session.
  clientIdentifier?: ClientIdentifier; // The client identifier for the session.
  ja3string?: string; // The JA3 string for the session.
  h2Settings?: H2Settings; // The settings for HTTP/2.
  h2SettingsOrder?: (keyof H2Settings)[]; // The order of HTTP/2 settings.
  supportedSignatureAlgorithms?: SupportedSignatureAlgorithms[]; // The supported signature algorithms.
  supportedVersions?: SupportedVersions[]; // The supported versions of TLS.
  keyShareCurves?: KeyShareCurves[]; // The supported elliptic curves for key exchange.
  certCompressionAlgo?: CertCompressionAlgo; // The certificate compression algorithm.
  pseudoHeaderOrder?: PseudoHeaderOrder[]; // The order of pseudo headers.
  connectionFlow?: number; // The connection flow for the session.
  priorityFrames?: PriorityFrames[]; // The priority frames for HTTP/2 streams.
  headerOrder?: string[]; // The order of headers.
  alpnProtocols?: string[]; // The ALPN protocols.
  alpsProtocols?: string[]; // The ALPS protocols.
  headerPriority?: PriorityParam; // The priority of headers.
  randomTlsExtensionOrder?: boolean; // Whether to randomize TLS extension order.
  forceHttp1?: boolean; // Whether to force HTTP/1 protocol.
  debug?: boolean; // Whether to enable debugging.
  insecureSkipVerify?: boolean; // Whether to skip SSL certificate verification.
}

/**
 * Represents base options for making HTTP requests, excluding the body.
 */
export interface BaseRequestOptions {
  headers?: OutgoingHttpHeaders; // The headers for the request.
  redirect?: boolean; // Whether to follow redirects.
  rejectUnauthorized?: boolean; // Whether to reject unauthorized SSL certificates.
  additionalDecode?: boolean; // Whether to perform additional decoding.
  timeout?: number; // The request timeout.
  proxy?: string; // The proxy server to use for the request.
  cookies?: Record<string, any>; // Cookies for the request.
}

/**
 * Represents options for making HTTP requests that may include a body.
 */
export interface RequestOptions extends BaseRequestOptions {
  body?: any; // The request body.
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
 * Represents a response from shared library.
 */
export interface response {
  id: string; // The unique identifier for the response.
  body: string; // The body of the response.
  cookies: Object; // Cookies set in the response.
  headers: IncomingHttpHeaders; // Headers included in the response.
  sessionId: string; // The session ID associated with the response.
  status: number; // The HTTP status code of the response.
  target: string; // The target URL of the response.
  usedProtocol: string; // The protocol used for the response.
}
