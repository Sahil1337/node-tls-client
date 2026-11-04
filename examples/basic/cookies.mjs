import { initTLS, destroyTLS, Session } from "node-tls-client";

await initTLS();

//#region jar
const session = new Session();
// httpbin sets `theme=dark` and redirects; we just want the Set-Cookie.
await session.get("https://httpbin.org/cookies/set/theme/dark");

// Sent automatically from now on:
const res = await session.get("https://httpbin.org/cookies");
console.log(await res.json()); // { cookies: { theme: 'dark' } }
//#endregion

//#region per-request
// Your own cookies: sent with this request AND added to the jar,
// so later requests to this host send them too.
const withConsent = await session.get("https://httpbin.org/cookies", {
  cookies: { consent: "yes", visits: 3 },
});
console.log(await withConsent.json()); // { cookies: { consent: 'yes', theme: 'dark', visits: '3' } }
//#endregion

//#region inspect
// response.cookies: what the jar holds for this host after the response.
const response = await session.get("https://httpbin.org/cookies/set/lang/en");
console.log(response.cookies); // { consent: 'yes', lang: 'en', theme: 'dark', visits: '3' }

// session.cookies(): every cookie the session has sent or received.
const all = await session.cookies();
console.log([...new Set(all.map((c) => c.key))]); // [ 'theme', 'consent', 'visits', 'lang' ]
//#endregion

await session.close();

//#region no-jar
const stateless = new Session({ withoutCookieJar: true });
await stateless.get("https://httpbin.org/cookies/set/theme/dark");
const fresh = await stateless.get("https://httpbin.org/cookies");
console.log(await fresh.json()); // { cookies: {} }
//#endregion
await stateless.close();

await destroyTLS();
