// initTLS({ libraryDir }) end to end with the real native library. Its own
// file, so its own process: loading a second copy of the Go library next to
// ffi.test.js's would be unsafe.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const { Session, initTLS, destroyTLS } = require("../dist");
const { locateLibrary } = require("../dist/native/library");
const { startServer } = require("./fixtures/http-server");

test("initTLS({ libraryDir }) loads the library from that directory, without downloading", async () => {
  // Make sure a binary exists in the default cache (downloads on a fresh
  // machine), then install a copy in a new, relative libraryDir.
  const cached = await locateLibrary();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ntc-libdir-"));
  const dir = path.join(root, "vendor", "tls");
  fs.mkdirSync(dir, { recursive: true });
  const installed = path.join(dir, path.basename(cached));
  fs.copyFileSync(cached, installed);

  const realRequest = https.request;
  https.request = () => {
    throw new Error("libraryDir must not trigger a download");
  };
  const server = await startServer();
  try {
    // A small concurrency keeps koffi's resident async pools at their default
    // on any machine, which the re-init test below relies on.
    await initTLS({
      libraryDir: path.relative(process.cwd(), dir),
      concurrency: 2,
    });
    // macOS system libraries live in the dyld cache, not on disk: keep those as-is.
    const real = (p) => (fs.existsSync(p) ? fs.realpathSync(p) : p);
    const loaded = process.report.getReport().sharedObjects.map(real);
    assert.ok(
      loaded.includes(fs.realpathSync(installed)),
      "the copy in libraryDir is the one loaded",
    );
    assert.ok(
      !loaded.includes(fs.realpathSync(cached)),
      "the default os.tmpdir() copy is not loaded",
    );
    assert.deepEqual(fs.readdirSync(dir), [path.basename(cached)]);

    const s = new Session({ timeout: 20000 });
    assert.equal((await s.get(`${server.base}/libdir`)).status, 200);
    await s.close();
  } finally {
    https.request = realRequest;
    await destroyTLS().catch(() => {});
    await server.close();
  }
});

// Runs after the test above, so its library copy is already loaded here (and
// destroyTLS() has already run: the loaded library itself stays in memory).
test("re-initialising keeps using the one loaded library: no second copy, no download, no false koffi warning", async () => {
  const tlsClientCopies = () =>
    process.report
      .getReport()
      .sharedObjects.filter((p) => path.basename(p).startsWith("tls-client-"));
  assert.equal(tlsClientCopies().length, 1, "precondition: one copy loaded");

  /** Runs `fn` and returns what it wrote to stderr (the logger's WARN lines). */
  const captureStderr = async (fn) => {
    const realWrite = process.stderr.write;
    let out = "";
    process.stderr.write = (chunk) => ((out += chunk), true);
    try {
      await fn();
    } finally {
      process.stderr.write = realWrite;
    }
    return out;
  };

  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "ntc-libdir-empty-"));
  const realRequest = https.request;
  https.request = () => {
    throw new Error("a library is already loaded: nothing to download");
  };
  const server = await startServer();
  try {
    // A different libraryDir, holding no library: nothing is downloaded or
    // loaded, and the user is told it only applies after a restart.
    const dirWarning = await captureStderr(() =>
      initTLS({ libraryDir: empty }),
    );
    assert.match(dirWarning, /libraryDir .*restart/s);
    // koffi's settings are frozen now, but max_async_calls already sits at its
    // ceiling, so a larger resident-pool target is no reason to warn. (The
    // warning is once per process: it would land in whichever init comes first.)
    assert.doesNotMatch(dirWarning, /could not raise koffi/);
    assert.deepEqual(fs.readdirSync(empty), []);
    assert.equal(tlsClientCopies().length, 1);
    let s = new Session({ timeout: 20000 });
    assert.equal((await s.get(`${server.base}/reinit-dir`)).status, 200);
    await s.close();
    await destroyTLS();

    // The default directory, with a larger concurrency than the first init
    // asked for.
    const concurrencyWarning = await captureStderr(() =>
      initTLS({ concurrency: 64 }),
    );
    assert.doesNotMatch(concurrencyWarning, /could not raise koffi/);
    assert.equal(tlsClientCopies().length, 1);
    s = new Session({ timeout: 20000 });
    assert.equal((await s.get(`${server.base}/reinit-default`)).status, 200);
    await s.close();
  } finally {
    https.request = realRequest;
    await destroyTLS().catch(() => {});
    await server.close();
    fs.rmSync(empty, { recursive: true, force: true });
  }
});
