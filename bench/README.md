# Benchmarks

The numbers and charts on the docs site's [Performance](https://sahil1337.github.io/node-tls-client/performance) page come from here. They compare node-tls-client 2.1.0 (from npm), this checkout with the default binary, and this checkout with `binary: "node-tls-client"`, plus node-fetch 2.7.0 for reference, all through their public APIs against a local server.

```sh
npm run build                 # from the repo root: run.js uses ../dist
cd bench && npm install       # node-tls-client 2.1.0 and node-fetch 2.7.0
NODETLS_LIB_DIR=/path/to/dir node run.js
node to-site.js               # medians → ../website/lib/benchmarks-2-2.json
```

- `NODETLS_LIB_DIR` is a directory holding a node-tls-client build under its cache name (`tls-client-<package version>-nodetls-<platform>`, e.g. `tls-client-2.2.0-nodetls-darwin-arm64.dylib`). Leave it unset to download the release.
- `run.js` runs every scenario three times, each run in a fresh process, with the clients in rotating order, and waits for leftover `TIME_WAIT` sockets between runs. It takes about 15 minutes and appends one line per run to `results.jsonl`.
- The HTTPS server uses a self-signed certificate made with `openssl` on first use (`certs/`).
- Close other heavy programs while it runs: the numbers are only comparable when nothing else competes for the CPU.
- On macOS, `run.js` keeps the machine awake with `caffeinate` until it exits; a Mac that sleeps mid-run (or closes its lid on battery) gives numbers that are off by 10× or more. Elsewhere, turn off sleep yourself.
