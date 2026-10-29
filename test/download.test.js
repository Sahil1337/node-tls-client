// Downloader against a fake `https.request`: no network, no GitHub API.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { EventEmitter, PassThrough } = require("stream");
const { LibraryDownloader } = require("../dist/utils/download");
const { LibraryHandler } = require("../dist/transport/ffi/native");

/** routes: url → { status, headers?, body? } (or a function of (method) → route). */
function fakeRequest(routes) {
  const seen = [];
  return {
    seen,
    request(url, options, cb) {
      seen.push(`${options.method} ${url}`);
      const req = new EventEmitter();
      req.end = () => {
        setImmediate(() => {
          const route = routes[url] ?? { status: 404 };
          const res = new PassThrough();
          res.statusCode = route.status;
          res.headers = {
            "content-length": String((route.body ?? "").length),
            ...(route.headers ?? {}),
          };
          cb(res);
          res.end(route.body ?? "");
        });
      };
      return req;
    },
  };
}

const REPO = "example/repo";
const LATEST = `https://github.com/${REPO}/releases/latest`;
const tagPage = `https://github.com/${REPO}/releases/tag/v9.9.9`;
const dl = (name) =>
  `https://github.com/${REPO}/releases/download/v9.9.9/${name}`;
const info = {
  name: "lib.bin",
  downloadNames: ["lib-xgo-{version}-os.bin", "lib-os-{version}.bin"],
};

function scratch() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ntc-test-"));
}

test("resolves the tag from the redirect and falls back to the legacy asset name on 404", async () => {
  const dir = scratch();
  const fake = fakeRequest({
    [LATEST]: { status: 302, headers: { location: tagPage } },
    [dl("lib-os-9.9.9.bin")]: {
      status: 302,
      headers: { location: "https://cdn.example/blob" },
    },
    "https://cdn.example/blob": { status: 200, body: "BINARY" },
  });
  const dest = path.join(dir, "lib.bin");
  const result = await LibraryDownloader.retrieveLibrary(
    info,
    dest,
    REPO,
    fake.request,
  );
  assert.deepEqual(result, { tag: "v9.9.9", asset: "lib-os-9.9.9.bin" });
  assert.equal(fs.readFileSync(dest, "utf8"), "BINARY");
  assert.ok(
    fake.seen.includes(`GET ${dl("lib-xgo-9.9.9-os.bin")}`),
    "xgo name tried first",
  );
  assert.equal(
    fs.readdirSync(dir).filter((f) => f.endsWith(".tmp")).length,
    0,
    "no temp file left",
  );
});

test("throws a TlsClientError listing every name tried when nothing exists", async () => {
  const dir = scratch();
  const fake = fakeRequest({
    [LATEST]: { status: 302, headers: { location: tagPage } },
  });
  await assert.rejects(
    LibraryDownloader.retrieveLibrary(
      info,
      path.join(dir, "lib.bin"),
      REPO,
      fake.request,
    ),
    (e) =>
      e.name === "TlsClientError" &&
      /lib-xgo-9\.9\.9-os\.bin, lib-os-9\.9\.9\.bin/.test(e.message),
  );
});

test("throws when the latest-release redirect is missing", async () => {
  const fake = fakeRequest({ [LATEST]: { status: 200, body: "" } });
  await assert.rejects(
    LibraryDownloader.retrieveLibrary(
      info,
      path.join(scratch(), "lib.bin"),
      REPO,
      fake.request,
    ),
    { name: "TlsClientError" },
  );
});

test("a stalled connection rejects instead of hanging", async () => {
  // Never answers; emits the socket idle timeout the real https.request would.
  const stalled = (url, options) => {
    assert.ok(options.timeout > 0, "idle timeout is set");
    const req = new EventEmitter();
    req.end = () => setImmediate(() => req.emit("timeout"));
    req.destroy = (err) => req.emit("error", err);
    return req;
  };
  await assert.rejects(
    LibraryDownloader.retrieveLibrary(
      info,
      path.join(scratch(), "lib.bin"),
      REPO,
      stalled,
    ),
    (e) => e.name === "TlsClientError" && /Timed out/.test(e.message),
  );
});

const pkgVersion = require("../package.json").version;

test("validateFile: failure leaves the process alive and a later attempt succeeds", async () => {
  const dir = scratch();
  const tlsInfo = LibraryHandler.fileInfo();
  const cached = `tls-client-${pkgVersion}-${tlsInfo.name}`;
  const real = `https://github.com/bogdanfinn/tls-client/releases/latest`;
  const bad = fakeRequest({
    [real]: {
      status: 302,
      headers: {
        location:
          "https://github.com/bogdanfinn/tls-client/releases/tag/v0.0.1",
      },
    },
  });
  await assert.rejects(
    LibraryHandler.validateFile({ request: bad.request, cacheDir: dir }),
    { name: "TlsClientError" },
  );
  assert.equal(fs.existsSync(path.join(dir, cached)), false);

  const first = tlsInfo.downloadNames[0].replace("{version}", "0.0.1");
  const good = fakeRequest({
    [real]: {
      status: 302,
      headers: {
        location:
          "https://github.com/bogdanfinn/tls-client/releases/tag/v0.0.1",
      },
    },
    [`https://github.com/bogdanfinn/tls-client/releases/download/v0.0.1/${first}`]:
      { status: 200, body: "X" },
  });
  await LibraryHandler.validateFile({ request: good.request, cacheDir: dir });
  assert.equal(fs.readFileSync(path.join(dir, cached), "utf8"), "X");
  assert.equal(LibraryHandler.currentLibraryPath(), path.join(dir, cached));
  // cached for this package version → no request at all
  const none = fakeRequest({});
  await LibraryHandler.validateFile({ request: none.request, cacheDir: dir });
  assert.equal(none.seen.length, 0);
});

test("validateFile: offline upgrade falls back to a previously cached binary", async () => {
  const dir = scratch();
  const tlsInfo = LibraryHandler.fileInfo();
  fs.writeFileSync(path.join(dir, tlsInfo.legacyName), "OLD"); // left by node-tls-client 2.1.0
  const offline = fakeRequest({}); // every request 404s
  await LibraryHandler.validateFile({
    request: offline.request,
    cacheDir: dir,
  });
  assert.equal(
    LibraryHandler.currentLibraryPath(),
    path.join(dir, tlsInfo.legacyName),
  );
  assert.equal(
    fs.existsSync(path.join(dir, `tls-client-${pkgVersion}-${tlsInfo.name}`)),
    false,
  );
});
