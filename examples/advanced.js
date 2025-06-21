const { Session, initTLS, destroyTLS } = require("node-tls-client");

/**
 * @description Demonstrates an advanced usage scenario with the node-tls-client library, showcasing custom TLS client configuration.
 *
 * This example illustrates the creation of a TLS session with tailored settings and the execution of a GET request.
 *
 * Custom TLS settings encompass a wide array of configurations, including:
 * - JA3 string specification
 * - Fine-tuning HTTP/2 settings
 * - Defining supported signature algorithms
 * - Specifying ALPN (Application-Layer Protocol Negotiation) protocols
 * - Declaring supported TLS versions
 * - Setting key share curves for cryptographic key exchange
 * - Choosing a certificate compression algorithm
 * - Configuring connection and header flow parameters
 * - Defining the order of headers and priority frames
 * - Providing default headers for HTTP requests
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions} for more details on session options.
 */

(async () => {
  await initTLS();

  const session = new Session({
    ja3string:
      "771,2570-4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,2570-0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-2570-21,2570-29-23-24,0",
    h2Settings: {
      HEADER_TABLE_SIZE: 65536,
      MAX_CONCURRENT_STREAMS: 1000,
      INITIAL_WINDOW_SIZE: 6291456,
      MAX_HEADER_LIST_SIZE: 262144,
    },
    h2SettingsOrder: [
      "HEADER_TABLE_SIZE",
      "MAX_CONCURRENT_STREAMS",
      "INITIAL_WINDOW_SIZE",
      "MAX_HEADER_LIST_SIZE",
    ],
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
    alpnProtocols: ["h2", "http/1.1"],
    alpsProtocols: ["h2"],
    supportedVersions: ["GREASE", "1.3", "1.2"],
    keyShareCurves: ["GREASE", "X25519"],
    certCompressionAlgo: "brotli",
    pseudoHeaderOrder: [":method", ":authority", ":scheme", ":path"],
    connectionFlow: 15663105,
    headerOrder: ["accept", "user-agent", "accept-encoding", "accept-language"],
    priorityFrames: [
      {
        streamID: 1,
        priorityParam: {
          streamDep: 1,
          exclusive: true,
          weight: 1,
        },
      },
    ],
    headerPriority: {
      streamDep: 1,
      exclusive: true,
      weight: 1,
    },
    headers: {
      accept:
        "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const response = await session.get("http://localhost:3000/");
  console.log(response.status, await response.text());
  await session.close();

  await destroyTLS();
})();
