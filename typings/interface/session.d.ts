/// <reference types="node" />
import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
/**
 * Represents various settings for HTTP/2 (h2) protocol.
 */
export interface H2Settings {
    HEADER_TABLE_SIZE?: number;
    ENABLE_PUSH?: boolean;
    MAX_CONCURRENT_STREAMS?: number;
    INITIAL_WINDOW_SIZE?: number;
    MAX_FRAME_SIZE?: number;
    MAX_HEADER_LIST_SIZE?: number;
}
/**
 * Represents various supported signature algorithms for TLS.
 */
export type SupportedSignatureAlgorithms = "PKCS1WithSHA256" | "PKCS1WithSHA384" | "PKCS1WithSHA512" | "PSSWithSHA256" | "PSSWithSHA384" | "PSSWithSHA512" | "ECDSAWithP256AndSHA256" | "ECDSAWithP384AndSHA384" | "ECDSAWithP521AndSHA512" | "PKCS1WithSHA1" | "ECDSAWithSHA1" | "Ed25519";
/**
 * Represents various supported versions of TLS.
 */
export type SupportedVersions = "GREASE" | "1.3" | "1.2" | "1.1" | "1.0";
/**
 * Represents various supported elliptic curves for key exchange.
 */
export type KeyShareCurves = "GREASE" | "P256" | "P384" | "P521" | "X25519" | "P256Kyber768" | "X25519Kyber512D" | "X25519Kyber768";
/**
 * Represents various certificate compression algorithms.
 */
export type CertCompressionAlgo = "zlib" | "brotli" | "zstd";
/**
 * Represents parameters for setting priority of HTTP/2 streams.
 */
export interface PriorityParam {
    streamDep: number;
    exclusive: boolean;
    weight: number;
}
/**
 * Represents priority frames for HTTP/2 streams.
 */
export interface PriorityFrames {
    streamID: number;
    priorityParam: PriorityParam;
}
/**
 * Represents the order of pseudo headers in HTTP/2 requests.
 */
export type PseudoHeaderOrder = ":method" | ":authority" | ":scheme" | ":path";
/**
 * Represents various HTTP methods.
 */
export type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
/**
 * Represents various client identifiers.
 *
 * The client identifiers are grouped by browser, mobile clients, and other clients.
 */
export declare enum ClientIdentifier {
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
    safari_15_6_1 = "safari_15_6_1",
    safari_16_0 = "safari_16_0",
    safari_ipad_15_6 = "safari_ipad_15_6",
    safari_ios_15_5 = "safari_ios_15_5",
    safari_ios_15_6 = "safari_ios_15_6",
    safari_ios_16_0 = "safari_ios_16_0",
    safari_ios_17_0 = "safari_ios_17_0",
    firefox_102 = "firefox_102",
    firefox_104 = "firefox_104",
    firefox_105 = "firefox_105",
    firefox_106 = "firefox_106",
    firefox_108 = "firefox_108",
    firefox_110 = "firefox_110",
    firefox_117 = "firefox_117",
    firefox_120 = "firefox_120",
    firefox_123 = "firefox_123",
    opera_89 = "opera_89",
    opera_90 = "opera_90",
    opera_91 = "opera_91",
    zalando_android_mobile = "zalando_android_mobile",
    zalando_ios_mobile = "zalando_ios_mobile",
    nike_ios_mobile = "nike_ios_mobile",
    nike_android_mobile = "nike_android_mobile",
    cloudscraper = "cloudscraper",
    mms_ios = "mms_ios",
    mms_ios_1 = "mms_ios_1",
    mms_ios_2 = "mms_ios_2",
    mms_ios_3 = "mms_ios_3",
    mesh_ios = "mesh_ios",
    mesh_ios_1 = "mesh_ios_1",
    mesh_ios_2 = "mesh_ios_2",
    mesh_android = "mesh_android",
    mesh_android_1 = "mesh_android_1",
    mesh_android_2 = "mesh_android_2",
    confirmed_ios = "confirmed_ios",
    confirmed_android = "confirmed_android",
    okhttp4_android_7 = "okhttp4_android_7",
    okhttp4_android_8 = "okhttp4_android_8",
    okhttp4_android_9 = "okhttp4_android_9",
    okhttp4_android_10 = "okhttp4_android_10",
    okhttp4_android_11 = "okhttp4_android_11",
    okhttp4_android_12 = "okhttp4_android_12",
    okhttp4_android_13 = "okhttp4_android_13"
}
/**
 * Represents options for creating a session.
 */
export interface SessionOptions {
    sessionId?: string;
    headers?: OutgoingHttpHeaders;
    proxy?: string;
    clientIdentifier?: ClientIdentifier;
    ja3string?: string;
    h2Settings?: H2Settings;
    h2SettingsOrder?: (keyof H2Settings)[];
    supportedSignatureAlgorithms?: SupportedSignatureAlgorithms[];
    supportedVersions?: SupportedVersions[];
    keyShareCurves?: KeyShareCurves[];
    certCompressionAlgo?: CertCompressionAlgo;
    pseudoHeaderOrder?: PseudoHeaderOrder[];
    connectionFlow?: number;
    priorityFrames?: PriorityFrames[];
    headerOrder?: string[];
    alpnProtocols?: string[];
    alpsProtocols?: string[];
    headerPriority?: PriorityParam;
    randomTlsExtensionOrder?: boolean;
    forceHttp1?: boolean;
    debug?: boolean;
    insecureSkipVerify?: boolean;
    timeout?: number;
    disableIPV4?: boolean;
    disableIPV6?: boolean;
}
/**
 * Represents base options for making HTTP requests, excluding the body.
 */
export interface BaseRequestOptions {
    headers?: OutgoingHttpHeaders;
    redirect?: boolean;
    additionalDecode?: boolean;
    proxy?: string;
    cookies?: Record<string, any>;
    byteResponse?: boolean;
    hostOverride?: string | null;
}
/**
 * Represents options for making HTTP requests that may include a body.
 */
export interface RequestOptions extends BaseRequestOptions {
    body?: any;
}
/**
 * Represents options for making a GET HTTP request.
 */
export interface GetRequestOptions extends BaseRequestOptions {
}
/**
 * Represents options for making a POST HTTP request.
 */
export interface PostRequestOptions extends RequestOptions {
}
/**
 * Represents options for making a PUT HTTP request.
 */
export interface PutRequestOptions extends RequestOptions {
}
/**
 * Represents options for making a DELETE HTTP request.
 */
export interface DeleteRequestOptions extends BaseRequestOptions {
}
/**
 * Represents options for making a PATCH HTTP request.
 */
export interface PatchRequestOptions extends RequestOptions {
}
/**
 * Represents options for making an OPTIONS HTTP request.
 */
export interface OptionsRequestOptions extends BaseRequestOptions {
}
/**
 * Represents options for making a HEAD HTTP request.
 */
export interface HeadRequestOptions extends BaseRequestOptions {
}
/**
 *  Represents options for making HTTP requests.
 */
export interface fetchOptions {
    method?: Methods;
    headers?: OutgoingHttpHeaders;
    body?: any;
    redirect?: boolean;
    additionalDecode?: boolean;
    proxy?: string;
    cookies?: Record<string, any>;
    options?: SessionOptions;
}
/**
 * Represents a response from shared library.
 */
export interface TlsResponse {
    id: string;
    body: string;
    cookies: Record<string, string>;
    headers: IncomingHttpHeaders;
    sessionId: string;
    status: number;
    target: string;
    usedProtocol: string;
}
