// Usage: node run.js. Runs the 2.1.0 → 2.2.0 benchmark matrix: one fresh process per run, 3 reps,
// client order rotated each rep, leftover TIME_WAIT sockets drained between
// runs. Appends one JSON line per run to results.jsonl; progress on stderr.
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const here = __dirname;
const OUT = path.join(here, "results.jsonl");

/** Waits (up to 90 s) until fewer than `limit` sockets are in TIME_WAIT, so one run's leftovers can't starve the next of ports. */
function drainTimeWait(limit = 2500) {
  for (let i = 0; i < 45; i++) {
    const out =
      spawnSync("netstat", ["-an"], { encoding: "utf8" }).stdout ?? "";
    if ((out.match(/TIME_WAIT/g) ?? []).length < limit) return;
    spawnSync("sleep", ["2"]);
  }
}
const CLIENTS = ["v210", "v220", "v220q", "nodefetch"];
/** BENCH_ONLY=name,name runs only those scenarios (e.g. to redo some after a harness fix). */
const ONLY = process.env.BENCH_ONLY?.split(",").filter(Boolean);
const REPS = 3;

let groups = [
  {
    server: ["50"],
    runs: [
      ...[
        [1, 100],
        [16, 480],
        [64, 1280],
        [256, 2560],
        [1024, 5120],
      ].map(([conc, count]) => ({
        name: `scale-c${conc}`,
        scenario: "closed",
        count,
        conc,
      })),
      { name: "burst-5000", scenario: "burst", count: 5000, conc: 5000 },
    ],
  },
  {
    server: ["0"],
    runs: [
      { name: "sequential", scenario: "closed", count: 2000, conc: 1 },
      { name: "cpu-c64", scenario: "closed", count: 10000, conc: 64 },
    ],
  },
  {
    server: ["50", "tls"],
    runs: [
      { name: "https-c64", scenario: "closed", count: 1280, conc: 64 },
      { name: "https-burst-2000", scenario: "burst", count: 2000, conc: 2000 },
    ],
  },
  {
    // HTTP/2 only: node-fetch has no HTTP/2, so it sits these out.
    server: ["50", "h2"],
    clients: ["v210", "v220", "v220q"],
    runs: [
      { name: "h2-c64", scenario: "closed", count: 1280, conc: 64 },
      { name: "h2-burst-2000", scenario: "burst", count: 2000, conc: 2000 },
    ],
  },
];

function startServer(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(here, "server.js"), ...args],
      {
        stdio: ["ignore", "pipe", "inherit"],
      },
    );
    child.stdout.once("data", (d) =>
      resolve({ child, url: d.toString().trim() }),
    );
    child.once("error", reject);
  });
}

// A Mac that sleeps mid-run produces numbers 10× off; keep it awake until this process exits.
if (process.platform === "darwin")
  spawn("caffeinate", ["-ims", "-w", String(process.pid)], {
    stdio: "ignore",
  }).unref();

if (ONLY) {
  for (const group of groups)
    group.runs = group.runs.filter((run) => ONLY.includes(run.name));
  groups = groups.filter((group) => group.runs.length);
}

(async () => {
  const total =
    groups.reduce(
      (n, g) => n + g.runs.length * (g.clients ?? CLIENTS).length,
      0,
    ) * REPS;
  let done = 0;
  const t0 = Date.now();
  for (const group of groups) {
    const { child, url } = await startServer(group.server);
    const tls = group.server.includes("tls") || group.server.includes("h2");
    const clients = group.clients ?? CLIENTS;
    for (const run of group.runs) {
      for (let rep = 1; rep <= REPS; rep++) {
        const order = clients.map(
          (_, i) => clients[(i + rep - 1) % clients.length],
        );
        for (const client of order) {
          drainTimeWait();
          const r = spawnSync(
            process.execPath,
            [
              "--no-warnings",
              path.join(here, "client.js"),
              client,
              run.scenario,
              String(run.count),
              String(run.conc),
              url,
            ],
            {
              encoding: "utf8",
              timeout: 200_000,
              env: {
                ...process.env,
                ...(tls ? { NODE_TLS_REJECT_UNAUTHORIZED: "0" } : {}),
              },
            },
          );
          const line = r.stdout
            .trim()
            .split("\n")
            .filter((l) => l.startsWith("{"))
            .pop();
          let result;
          try {
            result = JSON.parse(line);
          } catch {
            result = {
              client,
              error: `no result (exit ${r.status}): ${(r.stderr || "").slice(-300)}`,
            };
          }
          fs.appendFileSync(
            OUT,
            JSON.stringify({ name: run.name, rep, ...result }) + "\n",
          );
          done++;
          const mins = ((Date.now() - t0) / 60000).toFixed(1);
          process.stderr.write(
            `[${done}/${total} ${mins} min] ${run.name} rep${rep} ${client}: ${result.error ? "ERROR " + result.error.slice(0, 80) : `${result.rps} rps, bad ${result.bad}`}\n`,
          );
        }
      }
    }
    child.kill();
  }
  process.stderr.write(
    `ALL-DONE in ${((Date.now() - t0) / 60000).toFixed(1)} min\n`,
  );
})();
