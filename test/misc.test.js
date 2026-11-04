const test = require("node:test");
const assert = require("node:assert/strict");
const { TlsClientError } = require("../dist");
const { NativeClient } = require("../dist/native/client");
const { Session, fetch, destroyTLS } = require("../dist");
const { threadpoolDefaultIgnored } = require("../dist/utils/threadpool");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

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

test("concurrent destroyTLS() calls share one close()", async () => {
  let destroyAllCalls = 0;
  NativeClient.instance = new NativeClient(
    {
      async request() {},
      async destroySession() {},
      freeMemory() {},
      async destroyAll() {
        destroyAllCalls++;
      },
    },
    8,
  );
  try {
    await Promise.all([destroyTLS(), destroyTLS()]);
    assert.equal(destroyAllCalls, 1);
    assert.equal(NativeClient.instance, null);
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

test("threadpoolDefaultIgnored: only when we set it, the entry is ESM and Node starts the pool early", () => {
  const affected = [
    "20.0.0",
    "20.20.2",
    "21.7.3",
    "22.0.0",
    "22.17.1",
    "23.11.1",
    "24.0.0",
    "24.2.0",
  ];
  const unaffected = [
    "22.18.0",
    "22.23.4",
    "24.3.0",
    "24.11.0",
    "25.0.0",
    "26.7.0",
  ];
  for (const v of affected) {
    assert.equal(threadpoolDefaultIgnored(v, true, true), true, v);
    assert.equal(
      threadpoolDefaultIgnored(v, false, true),
      false,
      `${v} user-set`,
    );
    assert.equal(
      threadpoolDefaultIgnored(v, true, false),
      false,
      `${v} CJS entry`,
    );
  }
  for (const v of unaffected) {
    assert.equal(threadpoolDefaultIgnored(v, true, true), false, v);
  }
  assert.equal(threadpoolDefaultIgnored("not-a-version", true, true), false);
});

test(
  "importing from an ES module entry warns that the threadpool default did not apply, unless the user set it",
  {
    skip:
      !threadpoolDefaultIgnored(process.versions.node, true, true) &&
      "this Node version applies the default",
  },
  () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tls-esm-entry-"));
    try {
      const entry = path.join(dir, "entry.mjs");
      const dist = pathToFileURL(path.join(__dirname, "../dist/index.js"));
      fs.writeFileSync(entry, `import ${JSON.stringify(dist.href)};\n`);
      const run = (env) =>
        spawnSync(process.execPath, [entry], { env, encoding: "utf8" });

      const env = { ...process.env };
      delete env.UV_THREADPOOL_SIZE;
      const unset = run(env);
      assert.equal(unset.status, 0, unset.stderr);
      assert.match(unset.stderr, /did not apply/);
      assert.match(unset.stderr, /UV_THREADPOOL_SIZE=\d+ node app\.mjs/);

      const set = run({ ...env, UV_THREADPOOL_SIZE: "8" });
      assert.equal(set.status, 0, set.stderr);
      assert.doesNotMatch(set.stderr, /did not apply/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
);
