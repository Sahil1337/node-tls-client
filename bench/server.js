// Echo server in its own process, so its CPU doesn't count against the client.
// Usage: node server.js <delayMs> [tls|h2]. Prints the base URL.
//   plain: HTTP/1.1 (the test fixture)
//   tls:   HTTPS, HTTP/1.1 only, so every client (node-fetch has no HTTP/2)
//          uses the same protocol
//   h2:    HTTPS, HTTP/2 only (the tls-client builds; node-fetch can't run it)
//   Both use a self-signed certificate (certs/, made with openssl on first use).
const mode = process.argv[3];
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const delay = Number(process.argv[2] ?? 0);

if (mode !== "tls" && mode !== "h2") {
  const { startServer } = require("../test/fixtures/http-server.js");
  startServer({ delay }).then(({ base }) => process.stdout.write(base + "\n"));
} else {
  const https = require("node:https");
  const http2 = require("node:http2");
  const dir = path.join(__dirname, "certs");
  if (!fs.existsSync(path.join(dir, "cert.pem"))) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-days",
        "365",
        "-subj",
        "/CN=127.0.0.1",
        "-keyout",
        path.join(dir, "key.pem"),
        "-out",
        path.join(dir, "cert.pem"),
      ],
      { stdio: "ignore" },
    );
  }
  const key = fs.readFileSync(path.join(dir, "key.pem"));
  const cert = fs.readFileSync(path.join(dir, "cert.pem"));
  const handler = (req, res) => {
    req.resume();
    req.on("end", () =>
      setTimeout(() => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            url: req.url,
            method: req.method,
            httpVersion: req.httpVersion,
          }),
        );
      }, delay),
    );
  };
  const server =
    mode === "h2"
      ? http2.createSecureServer(
          { key, cert, settings: { maxConcurrentStreams: 1000 } },
          handler,
        )
      : https.createServer({ key, cert, ALPNProtocols: ["http/1.1"] }, handler);
  // A burst opens one connection per request: ask for a deep accept queue.
  // The OS caps it (macOS: kern.ipc.somaxconn, 128 by default), and a full
  // queue drops connections, which stalls the client a second or more.
  server.listen(0, "127.0.0.1", 4096, () =>
    process.stdout.write(`https://127.0.0.1:${server.address().port}\n`),
  );
}
