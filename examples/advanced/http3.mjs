import {
  initTLS,
  destroyTLS,
  Session,
  ClientIdentifier,
} from "node-tls-client";

await initTLS();

//#region racing
// Race HTTP/2 and HTTP/3 like a browser does; the faster one wins.
const racing = new Session({
  clientIdentifier: ClientIdentifier.chrome_144, // carries real HTTP/3 settings
  withProtocolRacing: true,
});
const res = await racing.get("https://cloudflare.com/cdn-cgi/trace");
console.log(res.usedProtocol); // "HTTP/2.0" or "HTTP/3.0", whichever won
//#endregion

//#region disable
// Never use QUIC, e.g. for high request volume (see Known issues).
const tcpOnly = new Session({ disableHttp3: true });
//#endregion

//#region custom
// On the ja3string path, the HTTP/3 SETTINGS frame is configurable too.
// (Shape only: with this JA3 string native 1.16.0 times out over QUIC.)
const custom = new Session({
  ja3string:
    "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0",
  withProtocolRacing: true,
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
  h3PseudoHeaderOrder: [":method", ":authority", ":scheme", ":path"],
  h3SendGreaseFrames: true,
});
//#endregion

await Promise.all([racing.close(), tcpOnly.close(), custom.close()]);
await destroyTLS();
