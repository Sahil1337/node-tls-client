// Echo server in its own process, so its CPU doesn't count against the client.
// Usage: node server.js <delayMs> [tls]. Prints the base URL.
//   plain: HTTP/1.1 (the test fixture)
//   tls:   HTTPS with ALPN h2 + http/1.1, self-signed certificate (certs/, made
//          with openssl on first use)
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const delay = Number(process.argv[2] ?? 0);

if (process.argv[3] !== "tls") {
  const { startServer } = require("../test/fixtures/http-server.js");
  startServer({ delay }).then(({ base }) => process.stdout.write(base + "\n"));
} else {
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
  const server = http2.createSecureServer(
    {
      key: fs.readFileSync(path.join(dir, "key.pem")),
      cert: fs.readFileSync(path.join(dir, "cert.pem")),
      allowHTTP1: true,
      settings: { maxConcurrentStreams: 1000 },
    },
    (req, res) => {
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
    },
  );
  server.listen(0, "127.0.0.1", () =>
    process.stdout.write(`https://127.0.0.1:${server.address().port}\n`),
  );
}
