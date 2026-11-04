import {
  initTLS,
  destroyTLS,
  Session,
  ClientIdentifier,
} from "node-tls-client";

await initTLS();

//#region profiles
const profiles = {
  chrome: {
    clientIdentifier: ClientIdentifier.chrome_150,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
  },
  firefox: {
    clientIdentifier: ClientIdentifier.firefox_148,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
  },
  iphone: {
    clientIdentifier: ClientIdentifier.safari_ios_26_0,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  },
};

for (const [name, { clientIdentifier, userAgent }] of Object.entries(
  profiles,
)) {
  const session = new Session({
    clientIdentifier,
    headers: { "user-agent": userAgent }, // the profile doesn't set headers
  });
  const seen = await (await session.get("https://tls.peet.ws/api/all")).json();
  console.log(name.padEnd(8), seen.tls.ja4, seen.http2.akamai_fingerprint_hash);
  await session.close();
}
// chrome   t13d1516h2_8daaf6152771_806a8c22fdea 52d84b11737d980aef856699f885ca86
// firefox  t13d1917h2_4d8ed5baf28e_3cbfd9057e0d 6ea73faa8fc5aac76bded7bd238f6433
// iphone   t13d2013h2_a09f3c656075_7f0f34a4126d c52879e43202aeb92740be6e8c86ea96
//#endregion

await destroyTLS();
