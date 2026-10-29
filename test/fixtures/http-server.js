// Local plain-HTTP echo server for tests (the native client speaks http://
// too, and nothing here depends on the TLS handshake). Echoes rawHeaders so
// header casing is visible.
const http = require("http");

function startServer({ delay = 0 } = {}) {
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      setTimeout(() => {
        res.writeHead(200, {
          "content-type": "application/json",
          "set-cookie": "sid=abc; Path=/",
        });
        res.end(
          JSON.stringify({
            url: req.url,
            method: req.method,
            httpVersion: req.httpVersion,
            rawHeaders: req.rawHeaders,
            body: Buffer.concat(chunks).toString("base64"),
          }),
        );
      }, delay);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        base: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

/** rawHeaders → [[name, value], ...] preserving order and casing. */
function pairs(rawHeaders) {
  const out = [];
  for (let i = 0; i < rawHeaders.length; i += 2)
    out.push([rawHeaders[i], rawHeaders[i + 1]]);
  return out;
}

module.exports = { startServer, pairs };
