import { OutgoingHttpHeaders } from "http";
import { ClientIdentifier } from "./client-identifier";
import {
  CandidateCipherSuite,
  CertCompressionAlgo,
  H2Settings,
  H3Settings,
  KeyShareCurves,
  PriorityFrames,
  PriorityParam,
  PseudoHeaderOrder,
  SupportedDelegatedCredentialsAlgorithms,
  SupportedSignatureAlgorithms,
  SupportedVersions,
} from "./fingerprint";
import { HeaderInput } from "./request";

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
   * layer over them per key, case-insensitively; the request's value and
   * casing win and `null`/`undefined` removes a session header. When neither
   * the session nor the request provides headers, a small built-in set is sent.
   */
  headers?: HeaderInput;

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
 * Transport-level options for HTTP requests.
 *
 * These options control connection reuse, compression, buffer sizes, and other low-level transport behaviors.
 */
export interface TransportOptions {
  /**
   * If true, disables HTTP keep-alive connections.
   */
  disableKeepAlives?: boolean;
  /**
   * If true, disables automatic response decompression (gzip, deflate, etc.).
   */
  disableCompression?: boolean;
  /**
   * The maximum number of idle (keep-alive) connections across all hosts.
   */
  maxIdleConns?: number;
  /**
   * The maximum number of idle (keep-alive) HTTP/1.1 connections to keep
   * per host. Default: 256, as in Node's `http.Agent` (0 means Go's default
   * of 2).
   */
  maxIdleConnsPerHost?: number;
  /**
   * The maximum number of total connections per host (idle + active).
   */
  maxConnsPerHost?: number;
  /**
   * The maximum number of bytes allowed in response headers. If zero, a default is used.
   */
  maxResponseHeaderBytes?: number;
  /**
   * The size of the write buffer in bytes. If zero, a default (typically 4KB) is used.
   */
  writeBufferSize?: number;
  /**
   * The size of the read buffer in bytes. If zero, a default (typically 4KB) is used.
   */
  readBufferSize?: number;
  /**
   * The maximum idle connection timeout, in nanoseconds.
   */
  idleConnTimeout?: number;
}
