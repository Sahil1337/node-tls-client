// initTLS({ binary: "node-tls-client" }) end to end with a real build of our
// tls-client fork. Its own file, so its own process: one Go library per
// process. Runs only when TLS_CLIENT_NODETLS_LIB names such a build.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Session, initTLS, destroyTLS } = require("../dist");
const { getClient } = require("../dist/native/runtime");
const { QueueClient } = require("../dist/native/client");
const { Worker } = require("worker_threads");
const { once } = require("events");
const { platformAsset } = require("../dist/native/library/assets");
const { startServer, pairs } = require("./fixtures/http-server");

const lib = process.env.TLS_CLIENT_NODETLS_LIB;
const pkgVersion = require("../package.json").version;
const opts = { timeout: 20000 };

let server;
let dir;
test.before(async () => {
  if (!lib) return;
  // Installed under our cache name, so initTLS() finds it without downloading.
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "ntc-nodetls-"));
  fs.copyFileSync(
    lib,
    path.join(dir, `tls-client-${pkgVersion}-nodetls-${platformAsset().name}`),
  );
  server = await startServer({ delay: 50 });
  await initTLS({ libraryDir: dir, binary: "node-tls-client" });
});
test.after(async () => {
  if (!lib) return;
  await destroyTLS().catch(() => {});
  await server.close();
});

const skip = !lib && "set TLS_CLIENT_NODETLS_LIB to a node-tls-client build";

test("the completion queue is in use", { skip }, () => {
  assert.ok(getClient() instanceof QueueClient, "queue mode in use");
});

test(
  "a worker thread gets the threadpool client (one queue per process); the main thread keeps the queue",
  { skip },
  async () => {
    const dist = path.join(__dirname, "..", "dist");
    const worker = new Worker(
      `
      const { parentPort, workerData: w } = require("worker_threads");
      const { Session, initTLS } = require(w.dist);
      const { getClient } = require(w.dist + "/native/runtime");
      const { ThreadpoolClient } = require(w.dist + "/native/client");
      (async () => {
        await initTLS({ libraryDir: w.dir, binary: "node-tls-client" });
        const s = new Session({ timeout: 20000 });
        const { status } = await s.get(w.url);
        await s.close();
        parentPort.postMessage({ threadpool: getClient() instanceof ThreadpoolClient, status });
      })();
      `,
      {
        eval: true,
        stderr: true,
        workerData: { dist, dir, url: `${server.base}/worker` },
      },
    );
    let stderr = "";
    worker.stderr.on("data", (chunk) => (stderr += chunk));
    const [result] = await once(worker, "message");
    await once(worker, "exit");
    assert.deepEqual(result, { threadpool: true, status: 200 });
    assert.match(stderr, /only on the main thread/);

    assert.ok(getClient() instanceof QueueClient);
    const s = new Session(opts);
    assert.equal((await s.get(`${server.base}/main`)).status, 200);
    await s.close();
  },
);

test(
  "headers, cookies and a Buffer body round-trip through the queue",
  { skip },
  async () => {
    const s = new Session({ ...opts, headers: { "x-s": "1" } });
    const sent = pairs(
      (
        await (
          await s.get(`${server.base}/h`, { headers: { "x-r": "2" } })
        ).json()
      ).rawHeaders,
    );
    assert.ok(sent.some(([k, v]) => k === "x-s" && v === "1"));
    assert.ok(sent.some(([k, v]) => k === "x-r" && v === "2"));

    assert.deepEqual((await s.get(`${server.base}/cookie`)).cookies, {
      sid: "abc",
    });
    const body = Buffer.from([0, 1, 2, 255, 254]);
    const echoed = await (await s.post(`${server.base}/bin`, { body })).json();
    assert.equal(echoed.body, body.toString("base64"));
    await s.close();
  },
);

test(
  "2,000 requests at once all run together and each gets its own response",
  { skip },
  async () => {
    const s = new Session(opts);
    const started = performance.now();
    const results = await Promise.all(
      Array.from({ length: 2000 }, (_, i) =>
        s.get(`${server.base}/burst/${i}`),
      ),
    );
    const elapsed = performance.now() - started;
    for (const [i, r] of results.entries()) {
      assert.equal(r.status, 200);
      assert.equal((await r.json()).url, `/burst/${i}`);
    }
    // 50 ms each: run 20 at a time, as on the threadpool, this takes 5 s.
    assert.ok(elapsed < 2500, `took ${Math.round(elapsed)} ms`);
    await s.close();
  },
);

test(
  "destroyTLS() waits for requests in flight; initTLS() again keeps the queue and ignores concurrency",
  { skip },
  async () => {
    const s = new Session(opts);
    const inFlight = s.get(`${server.base}/slow`);
    await destroyTLS();
    assert.equal((await inFlight).status, 200);

    let warned = "";
    const write = process.stderr.write;
    process.stderr.write = (chunk) => ((warned += chunk), true);
    try {
      await initTLS({ binary: "upstream", concurrency: 8 });
    } finally {
      process.stderr.write = write;
    }
    assert.match(warned, /concurrency.*no effect/);
    assert.ok(
      getClient() instanceof QueueClient,
      "the loaded library stays in use",
    );
    const s2 = new Session(opts);
    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) => s2.get(`${server.base}/again/${i}`)),
    );
    assert.equal(results.filter((r) => r.status === 200).length, 50);
    await s2.close();
  },
);
