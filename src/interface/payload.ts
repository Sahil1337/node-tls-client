import { OutgoingHttpHeaders } from "http2";
import {
  CertCompressionAlgo,
  H2Settings,
  KeyShareCurves,
  Methods,
  PriorityFrames,
  PriorityParam,
  PseudoHeaderOrder,
  SupportedSignatureAlgorithms,
  SupportedVersions,
  TransportOptions,
} from "./session";

export interface Payload {
  catchPanics: boolean;
  customTlsClient?: CustomTlsClient;
  tlsClientIdentifier?: string;
  transportOptions?: TransportOptions;
  followRedirects: boolean;
  forceHttp1: boolean;
  headerOrder: OutgoingHttpHeaders[];
  headers: OutgoingHttpHeaders;
  connectHeaders: Record<string, string[]>;
  insecureSkipVerify: boolean;
  isByteRequest: boolean;
  isByteResponse: boolean;
  isRotatingProxy: boolean;
  proxyUrl: string;
  requestBody: string;
  requestCookies: { name: string; value: string }[];
  requestHostOverride: string | null;
  requestMethod: Methods;
  requestUrl: string | URL;
  disableIPV6: boolean;
  disableIPV4: boolean;
  localAddress: string | null;
  sessionId: string;
  serverNameOverwrite?: string;
  streamOutputBlockSize?: number | null;
  streamOutputEOFSymbol?: string | null;
  streamOutputPath?: string | null;
  timeoutMilliseconds: number;
  withDebug: boolean;
  withDefaultCookieJar: boolean;
  withoutCookieJar: boolean;
  withRandomTLSExtensionOrder: boolean;
}

interface CustomTlsClient {
  ja3String: string;
  h2Settings: H2Settings;
  h2SettingsOrder: (keyof H2Settings)[];
  pseudoHeaderOrder: PseudoHeaderOrder[];
  connectionFlow: number;
  priorityFrames: PriorityFrames[];
  headerPriority: PriorityParam;
  certCompressionAlgo: CertCompressionAlgo;
  supportedVersions: SupportedVersions[];
  supportedSignatureAlgorithms: SupportedSignatureAlgorithms[];
  keyShareCurves: KeyShareCurves[];
  alpnProtocols: string[];
  alpsProtocols: string[];
}
