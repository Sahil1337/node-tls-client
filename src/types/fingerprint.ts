/**
 * Represents various settings for HTTP/2 (h2) protocol.
 */
export interface H2Settings {
  /**
   * The size of the header compression table used in HTTP/2.
   */
  HEADER_TABLE_SIZE?: number;

  /**
   * Indicates whether server push is enabled in HTTP/2: `1`/`0`. A boolean
   * (the 2.1.0 type) is accepted too and sent as `1`/`0`, since the native
   * settings map is numeric.
   */
  ENABLE_PUSH?: number | boolean;

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

  /**
   * Raw HTTP/2 setting id `0x7` (no standard name; sent as-is).
   */
  UNKNOWN_SETTING_7?: number;

  /**
   * Raw HTTP/2 setting id `0x8` (no standard name; sent as-is).
   */
  UNKNOWN_SETTING_8?: number;

  /**
   * Raw HTTP/2 setting id `0x9` (no standard name; sent as-is).
   */
  UNKNOWN_SETTING_9?: number;
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
