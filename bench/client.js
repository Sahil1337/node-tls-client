// One benchmark run through a client's public API; prints one JSON line.
// Usage: node client.js <client> <closed|burst> <count> <concurrency> <baseUrl>
// (run.js runs the whole matrix; build the repo first with `npm run build`)
//   v210   node-tls-client 2.1.0 from npm (Piscina workers, upstream native 1.16.0)
//   v220   node-tls-client 2.2.0, default binary (upstream 1.16.0, koffi async on the libuv pool)
//   v220q  node-tls-client 2.2.0, binary: "node-tls-client" (our build, completion queue + setNotify)
//   nodefetch  node-fetch 2.7.0, defaults (Node's global agent)
// Every client uses its defaults; HTTPS runs set NODE_TLS_REJECT_UNAUTHORIZED=0
// (self-signed server) and insecureSkipVerify for the tls clients.
const path = require("node:path");

// v220q: a directory holding a node-tls-client build under its cache name
// (tls-client-<version>-nodetls-<platform>), or unset to download the release.
const QUEUE_LIB_DIR = process.env.NODETLS_LIB_DIR || undefined;
const V220 = path.join(__dirname, "..", "dist");

const [client, scenario, countArg, concArg, base] = process.argv.slice(2);
const COUNT = Number(countArg);
const CONC = Number(concArg);
const TLS = base.startsWith("https:");

let get; // (url) => Promise<{ status, body }>
let teardown = async () => {};

async function setup() {
  if (client === "v210" || client === "v220" || client === "v220q") {
    const m = require(
      client === "v210"
        ? path.join(__dirname, "node_modules/node-tls-client")
        : V220,
    );
    await m.initTLS(
      client === "v220q"
        ? { binary: "node-tls-client", libraryDir: QUEUE_LIB_DIR }
        : undefined,
    );
    const session = new m.Session({ timeout: 60_000, insecureSkipVerify: TLS });
    get = async (url) => {
      const r = await session.get(url);
      return { status: r.status, body: r.body };
    };
    teardown = async () => {
      await session.close();
      await m.destroyTLS();
    };
  } else if (client === "nodefetch") {
    const fetch = require(path.join(__dirname, "node_modules/node-fetch"));
    get = async (url) => {
      const r = await fetch(url);
      return { status: r.status, body: await r.text() };
    };
  } else throw new Error(`unknown client ${client}`);
}

const latencies = [];
let bad = 0;
let firstError = null;
/** HTTP versions the server saw (it echoes req.httpVersion), so a run shows what it measured. */
const httpVersions = new Set();
async function one(i) {
  const url = `${base}/r/${i}`;
  const t = performance.now();
  try {
    const r = await get(url);
    if (r.status !== 200 || !r.body.includes(`/r/${i}`)) {
      bad++;
      firstError ??= `status ${r.status}: ${String(r.body).slice(0, 120)}`;
    }
    const version = /"httpVersion":"([^"]+)"/.exec(r.body)?.[1];
    if (version) httpVersions.add(version);
  } catch (e) {
    bad++;
    firstError ??= String(e?.cause?.code ?? e?.message ?? e);
  }
  latencies.push(performance.now() - t);
}

(async () => {
  const guard = setTimeout(() => {
    console.log(
      JSON.stringify({
        client,
        scenario,
        count: COUNT,
        conc: CONC,
        error: "timed out after 180 s",
      }),
    );
    process.exit(3);
  }, 180_000);
  await setup();

  // Warm up: library loaded, connections open, before the clock starts.
  const warm = scenario === "burst" ? 1 : Math.min(CONC, 64);
  await Promise.all(Array.from({ length: warm }, (_, i) => one(1e9 + i)));
  latencies.length = 0;
  bad = 0;
  firstError = null;

  let peakRss = process.memoryUsage.rss();
  const rssTimer = setInterval(
    () => (peakRss = Math.max(peakRss, process.memoryUsage.rss())),
    20,
  );
  const cpu0 = process.cpuUsage();
  const t0 = performance.now();
  if (scenario === "burst") {
    await Promise.all(Array.from({ length: COUNT }, (_, i) => one(i)));
  } else {
    let next = 0;
    await Promise.all(
      Array.from({ length: CONC }, async () => {
        while (next < COUNT) await one(next++);
      }),
    );
  }
  const wall = performance.now() - t0;
  const cpu = process.cpuUsage(cpu0);
  clearInterval(rssTimer);
  peakRss = Math.max(peakRss, process.memoryUsage.rss());

  latencies.sort((a, b) => a - b);
  const pct = (p) =>
    latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];
  console.log(
    JSON.stringify({
      client,
      scenario,
      count: COUNT,
      conc: scenario === "burst" ? COUNT : CONC,
      tls: TLS,
      rps: Math.round(COUNT / (wall / 1000)),
      wallMs: Math.round(wall),
      p50: +pct(0.5).toFixed(2),
      p99: +pct(0.99).toFixed(2),
      cpuUsPerReq: Math.round((cpu.user + cpu.system) / COUNT),
      peakRssMB: Math.round(peakRss / 1048576),
      bad,
      httpVersions: [...httpVersions].sort(),
      ...(firstError ? { firstError } : {}),
    }),
  );
  clearTimeout(guard);
  await teardown().catch(() => {});
  process.exit(0);
})().catch((e) => {
  console.log(
    JSON.stringify({
      client,
      scenario,
      count: COUNT,
      conc: CONC,
      error: String(e?.stack ?? e),
    }),
  );
  process.exit(2);
});
