import {
  initTLS,
  destroyTLS,
  Session,
  ClientIdentifier,
} from "node-tls-client";

await initTLS();

//#region merge
const session = new Session({
  clientIdentifier: ClientIdentifier.chrome_150,
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
  },
});

// Request headers are added on top of the session's.
const withAuth = await session.get("https://httpbin.org/headers", {
  headers: { authorization: "Bearer token" },
});
// → User-Agent, Accept-Language and Authorization are all sent

// null removes one session header for this request only.
const withoutLanguage = await session.get("https://httpbin.org/headers", {
  headers: { "accept-language": null },
});
// → only User-Agent is sent
//#endregion
const sent = (await withAuth.json()).headers;
console.log(
  sent["User-Agent"].slice(0, 11),
  sent["Accept-Language"],
  sent.Authorization,
);
console.log("Accept-Language" in (await withoutLanguage.json()).headers); // false

//#region order
const ordered = new Session({
  clientIdentifier: ClientIdentifier.chrome_150,
  headers: {
    accept: "text/html",
    "user-agent": "Mozilla/5.0 …",
    "accept-language": "en-US",
  },
  // Header names in the order the browser sends them.
  headerOrder: ["user-agent", "accept", "accept-language"],
});
//#endregion
const frames = await (await ordered.get("https://tls.peet.ws/api/all")).json();
const headersFrame = frames.http2.sent_frames.find(
  (f) => f.frame_type === "HEADERS",
);
console.log(headersFrame.headers); // [ ':method: GET', …, 'user-agent: …', 'accept: …', … ]

await session.close();
await ordered.close();
await destroyTLS();
