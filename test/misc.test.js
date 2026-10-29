const test = require("node:test");
const assert = require("node:assert/strict");
const { TlsClientError, logger } = require("../dist/utils");
const { Client } = require("../dist/core/client");
const { Session, fetch } = require("../dist");

test("TlsClientError keeps the wrapped error as cause and its stack", () => {
  const inner = new Error("boom");
  const e = new TlsClientError(inner);
  assert.equal(e.name, "TlsClientError");
  assert.equal(e.message, "boom");
  assert.equal(e.cause, inner);
  assert.equal(e.stack, inner.stack);
  assert.equal(new TlsClientError("plain").cause, undefined);
});

test("logger: warn/error go to stderr, and no escape codes when not a TTY", () => {
  const out = [];
  const err = [];
  const origOut = process.stdout.write;
  const origErr = process.stderr.write;
  process.stdout.write = (s) => (out.push(String(s)), true);
  process.stderr.write = (s) => (err.push(String(s)), true);
  try {
    logger.debug("d1");
    logger.warn("w1");
    logger.error("e1");
  } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }
  assert.equal(out.length, 1);
  assert.equal(err.length, 2);
  assert.match(err[0], /WARN: w1/);
  assert.match(err[1], /ERROR: e1/);
  if (!process.stderr.isTTY) assert.ok(!err[0].includes("\x1b["));
});

test("Response exposes usedProtocol; fetch() surfaces the request error, not close()'s", async () => {
  const calls = [];
  Client.instance = new Client({
    async request(p) {
      calls.push("request");
      if (p.requestUrl.endsWith("/fail")) throw new Error("native down");
      return JSON.stringify({
        id: "r",
        status: 200,
        body: "{}",
        headers: {},
        cookies: {},
        target: p.requestUrl,
        usedProtocol: "HTTP/2.0",
      });
    },
    async destroySession() {
      calls.push("destroySession");
      throw new Error("close exploded");
    },
    freeMemory() {},
    async destroy() {},
  });
  Client.ready = true;
  try {
    const r = await new Session({}).get("https://example.test/ok");
    assert.equal(r.usedProtocol, "HTTP/2.0");
    await assert.rejects(fetch("https://example.test/fail"), {
      name: "TlsClientError",
      message: "native down",
    });
    assert.deepEqual(calls, ["request", "request", "destroySession"]);
  } finally {
    Client.instance = null;
    Client.ready = false;
  }
});
