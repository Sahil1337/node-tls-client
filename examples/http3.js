const { Session, ClientIdentifier, initTLS, destroyTLS } = require("node-tls-client");

/**
 * @description Demonstrates HTTP/3 controls and new v1.15.1 parity options.
 * `disableHttp3` / `withProtocolRacing` apply to every request; the `h3*` and
 * ECH options only take effect on the ja3string path (inside customTlsClient).
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions}
 */
(async () => {
  await initTLS();

  // Top-level HTTP/3 controls (work with any clientIdentifier).
  const session = new Session({
    clientIdentifier: ClientIdentifier.chrome_146, // new default profile
    withProtocolRacing: true, // race HTTP/2 vs HTTP/3
    disableHttp3: false,
    timeout: 30 * 1000,
  });

  // Custom-client (ja3) path — h3Settings uses named string keys.
  const customSession = new Session({
    ja3string:
      "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0",
    h3Settings: {
      QPACK_MAX_TABLE_CAPACITY: 65536,
      MAX_FIELD_SECTION_SIZE: 262144,
      QPACK_BLOCKED_STREAMS: 100,
    },
    h3SettingsOrder: [
      "QPACK_MAX_TABLE_CAPACITY",
      "MAX_FIELD_SECTION_SIZE",
      "QPACK_BLOCKED_STREAMS",
    ],
    h3SendGreaseFrames: true,
  });

  try {
    const r1 = await session.get("https://tls.peet.ws/api/all");
    console.log("default profile:", r1.status);

    const r2 = await customSession.get("https://tls.peet.ws/api/all");
    console.log("custom ja3:", r2.status);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await session.close();
    await customSession.close();
    await destroyTLS();
  }
})();
