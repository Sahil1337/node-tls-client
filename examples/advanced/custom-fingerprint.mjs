import { initTLS, destroyTLS, Session } from "node-tls-client";

await initTLS();

//#region custom
const session = new Session({
  // TLS ClientHello: version, ciphers, extensions, curves, point formats
  ja3string:
    "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0",
  supportedSignatureAlgorithms: [
    "ECDSAWithP256AndSHA256",
    "PSSWithSHA256",
    "PKCS1WithSHA256",
    "ECDSAWithP384AndSHA384",
    "PSSWithSHA384",
    "PKCS1WithSHA384",
    "PSSWithSHA512",
    "PKCS1WithSHA512",
  ],
  supportedVersions: ["GREASE", "1.3", "1.2"],
  keyShareCurves: ["GREASE", "X25519"],
  certCompressionAlgos: ["brotli"],
  alpnProtocols: ["h2", "http/1.1"],
  alpsProtocols: ["h2"],

  // HTTP/2 SETTINGS frame, window update and header frame priority
  h2Settings: {
    HEADER_TABLE_SIZE: 65536,
    ENABLE_PUSH: 0,
    INITIAL_WINDOW_SIZE: 6291456,
    MAX_HEADER_LIST_SIZE: 262144,
  },
  h2SettingsOrder: [
    "HEADER_TABLE_SIZE",
    "ENABLE_PUSH",
    "INITIAL_WINDOW_SIZE",
    "MAX_HEADER_LIST_SIZE",
  ],
  connectionFlow: 15663105,
  pseudoHeaderOrder: [":method", ":authority", ":scheme", ":path"],
  headerPriority: { streamDep: 0, exclusive: true, weight: 255 }, // weight: 0–255
});

const seen = await (await session.get("https://tls.peet.ws/api/all")).json();
console.log(seen.http2.akamai_fingerprint); // 1:65536;2:0;4:6291456;6:262144|15663105|0|m,a,s,p
//#endregion
console.log(seen.tls.ja3.split(",").slice(0, 2).join(","));

await session.close();
await destroyTLS();
