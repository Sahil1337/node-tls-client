import {
  initTLS,
  destroyTLS,
  fetch,
  Session,
  TlsClientError,
} from "node-tls-client";

//#region rejects
try {
  await new Session().get("https://httpbin.org/get"); // before initTLS()
} catch (error) {
  console.log(error instanceof TlsClientError, error.message);
  // true Client not initialized. Call initTLS() first.
}
//#endregion

await initTLS();

//#region status-zero
async function getJson(session, url) {
  const res = await session.get(url);
  if (res.status === 0) {
    // DNS, TLS, proxy or timeout failure: body holds native's error text
    throw new Error(`request failed: ${res.body}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
//#endregion

const session = new Session({ timeout: 3000 });
console.log(
  await getJson(session, "https://httpbin.org/json").then(() => "json ok"),
);
await getJson(session, "https://httpbin.org/delay/5").catch((e) =>
  console.log(e.message),
);
// request failed: failed to do request: … (Client.Timeout exceeded while awaiting headers)

//#region invalid-body
try {
  await session.post("https://httpbin.org/post", { body: { not: "a string" } });
} catch (error) {
  console.log(error.message); // body must be a string or Buffer; JSON.stringify objects before sending
}
//#endregion

await fetch("https://httpbin.org/get", { method: "TRACE" }).catch((e) =>
  console.log(e.name, e.message),
);

await session.close();
await destroyTLS();
