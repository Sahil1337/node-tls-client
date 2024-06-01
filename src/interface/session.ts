import { IncomingHttpHeaders } from "http";

export type h2SettingKeys =
  | "HEADER_TABLE_SIZE"
  | "ENABLE_PUSH"
  | "MAX_CONCURRENT_STREAMS"
  | "INITIAL_WINDOW_SIZE"
  | "MAX_FRAME_SIZE"
  | "MAX_HEADER_LIST_SIZE";

export type h2Settings = Partial<{
  [K in h2SettingKeys]: number | boolean;
}>;

export type supportedSignatureAlgorithms =
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

export type supportedVersions = Partial<
  "GREASE" | "1.3" | "1.2" | "1.1" | "1.0"
>;

export type keyShareCurves = Partial<
  | "GREASE"
  | "P256"
  | "P384"
  | "P521"
  | "X25519"
  | "P256Kyber768"
  | "X25519Kyber512D"
  | "X25519Kyber768"
>;

export type certCompressionAlgo = Partial<"zlib" | "brotli" | "zstd">;

export type priorityParam = {
  streamDep: number;
  exclusive: boolean;
  weight: number;
};

export type priorityFrames = {
  streamID: number;
  priorityParam: priorityParam;
};

export type pseudoHeaderOrder = Partial<
  ":method" | ":authority" | ":scheme" | ":path"
>;

export type methods = Partial<
  "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"
>;

export interface sessionOptions {
  sessionId?: string;
  headers?: IncomingHttpHeaders;
  proxy?: string;
  clientIdentifier?: string;
  ja3string?: string;
  h2Settings?: h2Settings;
  h2SettingsOrder?: (keyof h2Settings)[];
  supportedSignatureAlgorithms?: supportedSignatureAlgorithms[];
  supportedVersions?: supportedVersions[];
  keyShareCurves?: keyShareCurves[];
  certCompressionAlgo?: certCompressionAlgo;
  pseudoHeaderOrder?: pseudoHeaderOrder[];
  connectionFlow?: number;
  priorityFrames?: priorityFrames[];
  headerOrder?: string[];
  alpnProtocols?: string[];
  alpsProtocols?: string[];
  headerPriority?: priorityParam;
  randomTlsExtensionOrder?: boolean;
  forceHttp1?: boolean;
  debug?: boolean;
  insecureSkipVerify?: boolean;
}

export interface requestOptions {
  body?: any;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  rejectUnauthorized?: boolean; // SSL certificate validation
  additionalDecode?: boolean;
  timeout?: number;
  proxy?: string;
  cookies?: Record<string, any>;
}

export type GetRequestOptions = {
  cookies?: Object;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  rejectUnauthorized?: boolean;
  timeout?: number;
  proxy?: string;
  additionalDecode?: boolean;
};

export type PostRequestOptions = {
  cookies?: Object;
  body?: any;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  rejectUnauthorized?: boolean;
  timeout?: number;
  additionalDecode?: boolean;
  proxy?: string;
};

export type PutRequestOptions = {
  cookies?: Object;
  body?: any;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  rejectUnauthorized?: boolean;
  timeout?: number;
  additionalDecode?: boolean;
  proxy?: string;
};

export type DeleteRequestOptions = {
  cookies?: Object;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  additionalDecode?: boolean;
  rejectUnauthorized?: boolean;
  timeout?: number;
  proxy?: string;
};

export type PatchRequestOptions = {
  cookies?: Object;
  body?: any;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  rejectUnauthorized?: boolean;
  timeout?: number;
  additionalDecode?: boolean;
  proxy?: string;
};

export type OptionsRequestOptions = {
  cookies?: Object;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  additionalDecode?: boolean;
  rejectUnauthorized?: boolean;
  timeout?: number;
  proxy?: string;
};

export type HeadRequestOptions = {
  cookies?: Object;
  headers?: IncomingHttpHeaders;
  redirect?: boolean;
  rejectUnauthorized?: boolean;
  additionalDecode?: boolean;
  timeout?: number;
  proxy?: string;
};

export interface response {
  id: string;
  body: string;
  cookies: Object;
  headers: IncomingHttpHeaders;
  sessionId: string;
  status: number;
  target: string;
  usedProtocol: string;
}
