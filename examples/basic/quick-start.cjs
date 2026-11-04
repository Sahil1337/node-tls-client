//#region session
const {
  initTLS,
  destroyTLS,
  Session,
  ClientIdentifier,
} = require("node-tls-client");

(async () => {
  await initTLS(); // loads (and on first run downloads) the native library

  const session = new Session({
    clientIdentifier: ClientIdentifier.chrome_150,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    },
    timeout: 10_000, // ms, for every request of this session
  });

  try {
    // tls.peet.ws echoes back the fingerprint it saw
    const res = await session.get("https://tls.peet.ws/api/all");
    const seen = await res.json();
    console.log(res.status, res.usedProtocol); // 200 HTTP/2.0
    console.log(seen.tls.ja4); // t13d1516h2_8daaf6152771_…, Chrome's JA4
  } finally {
    await session.close();
    await destroyTLS();
  }
})();
//#endregion
