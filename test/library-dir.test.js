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
    await initTLS({ libraryDir: path.relative(process.cwd(), dir) });
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
