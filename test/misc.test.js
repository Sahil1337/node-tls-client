const test = require("node:test");
const assert = require("node:assert/strict");
const { TlsClientError } = require("../dist");
const { NativeClient } = require("../dist/native/client");
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

test("Response exposes usedProtocol; fetch() surfaces the request error, not close()'s", async () => {
  const calls = [];
  NativeClient.instance = new NativeClient(
    {
      async request(json) {
        const p = JSON.parse(json);
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
      async destroyAll() {},
    },
    8,
  );
  try {
    const r = await new Session({}).get("https://example.test/ok");
    assert.equal(r.usedProtocol, "HTTP/2.0");
    await assert.rejects(fetch("https://example.test/fail"), (e) => {
      assert.ok(
        e instanceof TlsClientError,
        "root export matches what is thrown",
      );
      assert.equal(e.message, "native down");
      return true;
    });
    assert.deepEqual(calls, ["request", "request", "destroySession"]);
  } finally {
    NativeClient.instance = null;
  }
});

test("deep import paths kept from 2.1.0 still resolve to the same class", () => {
  assert.equal(
    require("../dist/utils/tlsError").TlsClientError,
    TlsClientError,
  );
  assert.equal(require("../dist/utils").TlsClientError, TlsClientError);
});
