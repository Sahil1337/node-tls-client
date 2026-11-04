// Payload construction against stubbed native bindings (no native code involved).
const test = require("node:test");
const assert = require("node:assert/strict");
const { NativeClient } = require("../dist/native/client");
const { Session, ClientIdentifier } = require("../dist");

function stubLibrary() {
  const calls = [];
  return {
    calls,
    async request(json) {
      const p = JSON.parse(json); // what native receives
      calls.push(["request", p]);
      return JSON.stringify({
        id: "r1",
        status: 200,
        body: "{}",
        headers: {},
        cookies: {},
        target: p.requestUrl,
        usedProtocol: "h2",
      });
    },
    async destroySession(json) {
      calls.push(["destroySession", JSON.parse(json).sessionId]);
      return JSON.stringify({ id: "d1", success: true });
    },
    freeMemory(id) {
      calls.push(["freeMemory", id]);
    },
    async destroyAll() {
      return JSON.stringify({ id: "a1", success: true });
    },
  };
}

function install() {
  const stub = stubLibrary();
  NativeClient.instance = new NativeClient(stub, 8); // TS privacy is erased at runtime
  return stub;
}
function uninstall() {
  NativeClient.instance = null;
}

async function payloadFor(sessionOpts, method = "get", reqOpts = {}) {
  const stub = install();
  try {
    const s = new Session(sessionOpts);
    await s[method]("https://example.test/x", reqOpts);
    return stub.calls.find((c) => c[0] === "request")[1];
  } finally {
    uninstall();
  }
}

test("default profile is chrome_150; explicit identifier respected", async () => {
  assert.equal(
    (await payloadFor({})).tlsClientIdentifier,
    ClientIdentifier.chrome_150,
  );
  assert.equal(
    (await payloadFor({ clientIdentifier: ClientIdentifier.chrome_131 }))
      .tlsClientIdentifier,
    "chrome_131",
  );
});

test("timeouts: seconds only when ms unset/0; both → ms only", async () => {
  let p = await payloadFor({ timeout: 0, timeoutSeconds: 30 });
  assert.equal(p.timeoutMilliseconds, 0);
  assert.equal(p.timeoutSeconds, 30);
  p = await payloadFor({ timeout: 5000, timeoutSeconds: 30 });
  assert.equal(p.timeoutMilliseconds, 5000);
  assert.equal("timeoutSeconds" in p, false);
  p = await payloadFor({ timeout: 5000 });
  assert.equal(p.timeoutMilliseconds, 5000);
  assert.equal("timeoutSeconds" in p, false);
});

test("headers: library defaults only when none given, explicit {} honored, connectHeaders precedence", async () => {
  let p = await payloadFor({});
  assert.match(p.headers["User-Agent"], /^tls-client\//);
  p = await payloadFor({ headers: {} }, "get", { headers: {} });
  assert.deepEqual(p.headers, {});
  p = await payloadFor({ connectHeaders: { a: ["s"] } }, "get", {
    connectHeaders: { a: ["r"] },
  });
  assert.deepEqual(p.connectHeaders, { a: ["r"] });
});

test("headerPriority: zeroed default when unset (2.1.0 behavior), omitted when null", async () => {
  const base = { ja3string: "771,4865,0,29,0" };
  let p = await payloadFor(base);
  assert.deepEqual(p.customTlsClient.headerPriority, {
    streamDep: 0,
    exclusive: false,
    weight: 0,
  });
  assert.equal("trustAnchorsPayload" in p.customTlsClient, false);
  p = await payloadFor({ ...base, headerPriority: null });
  assert.equal("headerPriority" in p.customTlsClient, false);
  p = await payloadFor({
    ...base,
    headerPriority: { streamDep: 1, exclusive: true, weight: 1 },
    trustAnchorsPayload: "abc",
  });
  assert.deepEqual(p.customTlsClient.headerPriority, {
    streamDep: 1,
    exclusive: true,
    weight: 1,
  });
  assert.equal(p.customTlsClient.trustAnchorsPayload, "abc");
});

test("body: string as-is, Buffer → base64 + isByteRequest, object → TlsClientError", async () => {
  let p = await payloadFor({}, "post", { body: "hello" });
  assert.equal(p.requestBody, "hello");
  assert.equal(p.isByteRequest, false);
  p = await payloadFor({}, "post", { body: Buffer.from("hi") });
  assert.equal(p.requestBody, Buffer.from("hi").toString("base64"));
  assert.equal(p.isByteRequest, true);
  // a Uint8Array view at an offset encodes only its own bytes
  const view = new Uint8Array([9, 9, 0, 1, 255, 9]).subarray(2, 5);
  p = await payloadFor({}, "post", { body: view });
  assert.equal(p.requestBody, Buffer.from([0, 1, 255]).toString("base64"));
  assert.equal(p.isByteRequest, true);
  install();
  try {
    await assert.rejects(
      new Session({}).post("https://example.test/x", { body: { a: 1 } }),
      { name: "TlsClientError" },
    );
  } finally {
    uninstall();
  }
});

test("isByteRequest is case-insensitive on header names", async () => {
  const p = await payloadFor({}, "post", {
    headers: { "CONTENT-TYPE": "image/png" },
    body: "x",
  });
  assert.equal(p.isByteRequest, true);
});

test("responses are freed right away; close() frees its id and is idempotent", async () => {
  const stub = install();
  try {
    const s = new Session({});
    await s.get("https://example.test/x");
    assert.deepEqual(
      stub.calls.filter((c) => c[0] === "freeMemory").map((c) => c[1]),
      ["r1"],
    );
    const a = await s.close();
    const b = await s.close();
    assert.equal(a, b);
    assert.equal(stub.calls.filter((c) => c[0] === "destroySession").length, 1);
    assert.deepEqual(
      stub.calls.filter((c) => c[0] === "freeMemory").map((c) => c[1]),
      ["r1", "d1"],
    );
  } finally {
    uninstall();
  }
});

test("a request after close() re-arms close(); back-to-back close() calls stay idempotent", async () => {
  const stub = install();
  try {
    const destroys = () =>
      stub.calls.filter((c) => c[0] === "destroySession").length;
    const s = new Session({});
    await s.get("https://example.test/x");
    await s.close();
    await s.get("https://example.test/x"); // native recreates the session
    await s.close();
    assert.equal(destroys(), 2);
    await Promise.all([s.close(), s.close()]);
    assert.equal(destroys(), 2);
  } finally {
    uninstall();
  }
});

test("sessionId option is honored; request cookie values are sent verbatim", async () => {
  let p = await payloadFor({ sessionId: "user-42" });
  assert.equal(p.sessionId, "user-42");
  p = await payloadFor({}, "get", { cookies: { pref: "a=1;b=2", n: 7 } });
  assert.deepEqual(p.requestCookies, [
    { name: "pref", value: "a=1;b=2" },
    { name: "n", value: "7" },
  ]);
});

test("h2Settings: UNKNOWN_SETTING_9 and its order entry pass through unchanged", async () => {
  const order = ["HEADER_TABLE_SIZE", "UNKNOWN_SETTING_9"];
  const p = await payloadFor({
    ja3string: "771,4865,0,29,0",
    h2Settings: { HEADER_TABLE_SIZE: 65536, UNKNOWN_SETTING_9: 1 },
    h2SettingsOrder: order,
  });
  assert.deepEqual(p.customTlsClient.h2Settings, {
    HEADER_TABLE_SIZE: 65536,
    UNKNOWN_SETTING_9: 1,
  });
  assert.deepEqual(p.customTlsClient.h2SettingsOrder, order);
});

test("transportOptions: a partial object is sent unchanged, plus the idle-connection default", async () => {
  const p = await payloadFor({
    transportOptions: { idleConnTimeout: 30_000_000_000 },
  });
  assert.deepEqual(p.transportOptions, {
    idleConnTimeout: 30_000_000_000,
    maxIdleConnsPerHost: 256,
  });
});

test("transportOptions: maxIdleConnsPerHost defaults to 256; a set value, 0 included, wins", async () => {
  assert.deepEqual((await payloadFor({})).transportOptions, {
    maxIdleConnsPerHost: 256,
  });
  for (const n of [0, 8]) {
    const p = await payloadFor({
      transportOptions: { maxIdleConnsPerHost: n },
    });
    assert.deepEqual(p.transportOptions, { maxIdleConnsPerHost: n });
  }
});

test("h2Settings: a boolean ENABLE_PUSH (2.1.0 type) is sent as 1/0", async () => {
  for (const [push, wire] of [
    [false, 0],
    [true, 1],
    [0, 0],
  ]) {
    const p = await payloadFor({
      ja3string: "771,4865,0,29,0",
      h2Settings: { HEADER_TABLE_SIZE: 65536, ENABLE_PUSH: push },
    });
    assert.deepEqual(p.customTlsClient.h2Settings, {
      HEADER_TABLE_SIZE: 65536,
      ENABLE_PUSH: wire,
    });
  }
});
