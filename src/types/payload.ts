import { OutgoingHttpHeaders } from "http2";
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
import { Methods } from "./request";
import { TransportOptions } from "./session";

/** One per-request cookie as native expects it (`[]CookieInput`). */
export interface RequestCookie {
  name: string;
  value: string;
}

/** Mirrors native `RequestInput` (cffi_src/types.go). */
export interface Payload {
  catchPanics: boolean;
  customTlsClient?: CustomTlsClient;
  tlsClientIdentifier?: string;
  transportOptions?: TransportOptions;
  followRedirects: boolean;
  forceHttp1: boolean;
  headerOrder: string[] | OutgoingHttpHeaders[];
  headers: Record<string, string>;
  connectHeaders: Record<string, string[]>;
  insecureSkipVerify: boolean;
  isByteRequest: boolean;
  isByteResponse: boolean;
  isRotatingProxy: boolean;
  proxyUrl: string;
  requestBody: string | null;
  requestCookies: RequestCookie[];
  requestHostOverride: string | null;
  requestMethod: Methods;
  requestUrl: string;
  disableIPV6: boolean;
  disableIPV4: boolean;
  localAddress: string | null;
  sessionId: string;
  serverNameOverwrite?: string;
  streamOutputBlockSize?: number | null;
  streamOutputEOFSymbol?: string | null;
  streamOutputPath?: string | null;
  timeoutMilliseconds: number;
  timeoutSeconds?: number;
  withDebug: boolean;
  withoutCookieJar: boolean;
  withCustomCookieJar: boolean;
  withRandomTLSExtensionOrder: boolean;
  disableHttp3: boolean;
  withProtocolRacing: boolean;
  disableSessionTickets: boolean;
  certificatePinningHosts?: Record<string, string[]>;
}

export interface CustomTlsClient {
  ja3String: string;
  /** Native's settings map is numeric (`map[string]uint32`). */
  h2Settings: { [K in keyof H2Settings]?: number };
  h2SettingsOrder: (keyof H2Settings)[];
  pseudoHeaderOrder: PseudoHeaderOrder[];
  connectionFlow: number;
  priorityFrames: PriorityFrames[];
  /** Omitted only when the user passed `null` (native treats nil as "unset"). */
  headerPriority?: PriorityParam;
  certCompressionAlgos: CertCompressionAlgo[];
  supportedVersions: SupportedVersions[];
  supportedSignatureAlgorithms: SupportedSignatureAlgorithms[];
  supportedDelegatedCredentialsAlgorithms: SupportedDelegatedCredentialsAlgorithms[];
  keyShareCurves: KeyShareCurves[];
  alpnProtocols: string[];
  alpsProtocols: string[];
  h3Settings: H3Settings;
  h3SettingsOrder: (keyof H3Settings)[];
  h3PseudoHeaderOrder: PseudoHeaderOrder[];
  h3PriorityParam: number;
  h3SendGreaseFrames: boolean;
  ECHCandidatePayloads: number[];
  ECHCandidateCipherSuites: CandidateCipherSuite[];
  recordSizeLimit: number;
  streamId: number;
  allowHttp: boolean;
  trustAnchorsPayload?: string;
}
