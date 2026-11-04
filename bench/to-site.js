// Usage: node to-site.js. results.jsonl → website/lib/benchmarks-2-2.json (medians per scenario and client).
const fs = require("node:fs");
const path = require("node:path");

const rows = fs
  .readFileSync(path.join(__dirname, "results.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));
const errors = rows.filter((r) => r.error);
if (errors.length)
  console.warn(
    `${errors.length} runs without a result:`,
    errors.map((e) => `${e.name}/${e.client}`),
  );

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2
    ? s[(s.length - 1) / 2]
    : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const metrics = ["rps", "wallMs", "p50", "p99", "cpuUsPerReq", "peakRssMB"];
const scenarios = {};
for (const r of rows.filter((r) => !r.error))
  ((scenarios[r.name] ??= {})[r.client] ??= []).push(r);
for (const byClient of Object.values(scenarios)) {
  for (const [client, runs] of Object.entries(byClient)) {
    const m = Object.fromEntries(
      metrics.map((k) => [k, median(runs.map((r) => r[k]))]),
    );
    m.bad = runs.reduce((n, r) => n + r.bad, 0);
    m.runs = runs.length;
    byClient[client] = m;
  }
}

const out = {
  meta: {
    date: "2026-11-04",
    machine: "Apple M5, 10 cores, 16 GB, macOS 26.6",
    node: process.version,
    runsPerCell: 3,
  },
  clients: [
    { id: "v210", label: "2.1.0" },
    { id: "v220", label: "2.2.0" },
    { id: "v220q", label: "2.2.0 + node-tls-client binary" },
  ],
  scale: [1, 16, 64, 256, 1024].map((conc) => ({
    name: `scale-c${conc}`,
    conc,
  })),
  scaleCaption:
    "Requests per second (higher is better) at each number of requests in flight, against a server that answers in 50 ms. Hover or focus the chart for values; all of them are in the table below.",
  stats: [
    {
      label: "5,000 requests at once",
      scenario: "burst-5000",
      metric: "wallMs",
      unit: "s",
      from: "v210",
      to: "v220q",
      better: "lower",
      phrase: "faster",
      note: "with the node-tls-client binary",
    },
    {
      label: "CPU per request",
      scenario: "scale-c64",
      metric: "cpuUsPerReq",
      unit: "µs",
      from: "v210",
      to: "v220",
      better: "lower",
      phrase: "less CPU",
      note: "64 in flight, default binary",
    },
    {
      label: "Memory, 64 in flight",
      scenario: "scale-c64",
      metric: "peakRssMB",
      unit: "MB",
      from: "v210",
      to: "v220",
      better: "lower",
      phrase: "less memory",
      note: "peak, default binary",
    },
  ],
  scenarios,
};
const dir = path.join(__dirname, "..", "website", "lib");
fs.writeFileSync(
  path.join(dir, "benchmarks-2-2.json"),
  JSON.stringify(out, null, 2) + "\n",
);

// The results table as Markdown, included by performance.mdx, so the page's
// Markdown copy (llms.txt, "Copy Markdown") carries the numbers too.
const table = [
  ...[1, 16, 64, 256, 1024].map((c) => ({
    label: `${c.toLocaleString("en-US")} in flight, 50 ms server: requests/s`,
    scenario: `scale-c${c}`,
    metric: "rps",
    unit: "req/s",
  })),
  {
    label: "5,000 at once, 50 ms server: time to finish",
    scenario: "burst-5000",
    metric: "wallMs",
    unit: "s",
  },
  {
    label: "5,000 at once, 50 ms server: peak memory",
    scenario: "burst-5000",
    metric: "peakRssMB",
    unit: "MB",
  },
  {
    label: "16 in flight, 50 ms server: CPU per request",
    scenario: "scale-c16",
    metric: "cpuUsPerReq",
    unit: "µs",
  },
  {
    label: "64 in flight, 50 ms server: CPU per request",
    scenario: "scale-c64",
    metric: "cpuUsPerReq",
    unit: "µs",
  },
  {
    label: "64 in flight, 50 ms server: peak memory",
    scenario: "scale-c64",
    metric: "peakRssMB",
    unit: "MB",
  },
  {
    label: "One at a time, instant server: median latency",
    scenario: "sequential",
    metric: "p50",
    unit: "ms",
  },
  {
    label: "64 in flight, instant server: requests/s",
    scenario: "cpu-c64",
    metric: "rps",
    unit: "req/s",
  },
  {
    label: "64 in flight, instant server: CPU per request",
    scenario: "cpu-c64",
    metric: "cpuUsPerReq",
    unit: "µs",
  },
  {
    label: "HTTPS, 64 in flight, 50 ms server: requests/s",
    scenario: "https-c64",
    metric: "rps",
    unit: "req/s",
  },
  {
    label: "HTTPS, 2,000 at once, 50 ms server: time to finish",
    scenario: "https-burst-2000",
    metric: "wallMs",
    unit: "s",
  },
];
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const fmt = {
  s: (v) => `${(v / 1000).toFixed(v >= 10_000 ? 1 : 2)} s`,
  ms: (v) => `${nf.format(v)} ms`,
  µs: (v) => `${Math.round(v).toLocaleString("en-US")} µs`,
  MB: (v) => `${Math.round(v)} MB`,
  "req/s": (v) => `${Math.round(v).toLocaleString("en-US")} req/s`,
};
const columns = [
  ...out.clients,
  { id: "nodefetch", label: "node-fetch 2.7.0" },
];
const md = [
  `| Scenario | ${columns.map((c) => c.label).join(" | ")} |`,
  `| --- | ${columns.map(() => "---:").join(" | ")} |`,
  ...table.map(
    (t) =>
      `| ${t.label} | ${columns.map((c) => fmt[t.unit](scenarios[t.scenario][c.id][t.metric])).join(" | ")} |`,
  ),
];
fs.writeFileSync(
  path.join(dir, "benchmarks-2-2-table.md"),
  md.join("\n") + "\n",
);

const bad = Object.entries(scenarios).flatMap(([n, cs]) =>
  Object.entries(cs)
    .filter(([, m]) => m.bad)
    .map(([c, m]) => `${n}/${c}: ${m.bad} bad`),
);
console.log(
  `wrote ${dir}/benchmarks-2-2{.json,-table.md}; cells with bad responses: ${bad.length ? bad.join(", ") : "none"}`,
);
