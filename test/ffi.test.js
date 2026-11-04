const test = require("node:test");
const assert = require("node:assert/strict");
const { Session, initTLS, destroyTLS, fetch } = require("../dist");
const { startServer, pairs } = require("./fixtures/http-server");

let server;
test.before(async () => {
  server = await startServer({ delay: 20 });
  await initTLS();
});
test.after(async () => {
  await destroyTLS();
  await server.close();
});

const opts = { timeout: 20000 };

test("header merge on the wire (#14): one UA header, request wins, session keys kept, null removes", async () => {
  const s = new Session({
    ...opts,
    headers: { "User-Agent": "sess-ua", "x-s": "1" },
  });
  const res = await s.get(`${server.base}/h`, {
    headers: { "user-agent": "req-ua", "x-r": "2" },
  });
  assert.equal(res.status, 200);
  let sent = pairs((await res.json()).rawHeaders);
  const ua = sent.filter(([k]) => k.toLowerCase() === "user-agent");
  assert.deepEqual(ua, [["user-agent", "req-ua"]]);
  assert.ok(sent.some(([k, v]) => k === "x-s" && v === "1"));
  assert.ok(sent.some(([k, v]) => k === "x-r" && v === "2"));

  sent = pairs(
    (
      await (
        await s.get(`${server.base}/a`, { headers: { "x-s": null } })
      ).json()
    ).rawHeaders,
  );
  assert.equal(
    sent.some(([k]) => k === "x-s"),
    false,
  );
  await s.close();
});

test("cookies persist across requests and are exposed on the response", async () => {
  const s = new Session(opts);
  const r1 = await s.get(`${server.base}/cookie`);
  assert.deepEqual(r1.cookies, { sid: "abc" });
  const sent = pairs(
    (await (await s.get(`${server.base}/again`)).json()).rawHeaders,
  );
  assert.ok(
    sent.some(
      ([k, v]) => k.toLowerCase() === "cookie" && v.includes("sid=abc"),
    ),
  );
  await s.close();
});

test("Buffer body arrives as the raw bytes", async () => {
  const s = new Session(opts);
  const body = Buffer.from([0, 1, 2, 255, 254]);
  const echoed = await (await s.post(`${server.base}/bin`, { body })).json();
  assert.equal(echoed.body, body.toString("base64"));
  await s.close();
});

test("300 concurrent requests all succeed", async () => {
  const s = new Session(opts);
  const results = await Promise.all(
    Array.from({ length: 300 }, (_, i) => s.get(`${server.base}/burst/${i}`)),
  );
  assert.equal(results.filter((r) => r.status === 200).length, 300);
  await s.close();
});

test("fetch() helper works and closes its session", async () => {
  const r = await fetch(`${server.base}/fetch`, {
    options: opts,
    headers: { "x-f": "1" },
  });
  assert.equal(r.status, 200);
  assert.ok(pairs((await r.json()).rawHeaders).some(([k]) => k === "x-f"));
});

test("ja3 session with a boolean ENABLE_PUSH (2.1.0 type) succeeds natively", async () => {
  const s = new Session({
    ...opts,
    ja3string:
      "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0",
    h2Settings: { HEADER_TABLE_SIZE: 65536, ENABLE_PUSH: false },
    h2SettingsOrder: ["HEADER_TABLE_SIZE", "ENABLE_PUSH"],
  });
  const r = await s.get(`${server.base}/push`);
  assert.equal(r.status, 200, r.body);
  await s.close();
});

test("destroyTLS then initTLS again works (koffi config already applied)", async () => {
  await destroyTLS();
  await initTLS({ concurrency: 4 });
  const s = new Session(opts);
  assert.equal((await s.get(`${server.base}/reinit`)).status, 200);
  await s.close();
});

test("destroyTLS and initTLS called together leave the client initialized", async () => {
  await Promise.all([destroyTLS(), initTLS()]);
  const s = new Session(opts);
  assert.equal((await s.get(`${server.base}/reinit`)).status, 200);
  await s.close();
});
