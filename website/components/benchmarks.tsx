"use client";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import data from "@/lib/benchmarks-2-2.json";

// Charts for the 2.1 → 2.2 benchmark (lib/benchmarks-2-2.json, generated from
// the benchmark run). Colors are the --viz-* tokens in app/global.css: one per
// client, the same on every chart, light and dark validated against the page.

type Metric = "rps" | "wallMs" | "p50" | "p99" | "cpuUsPerReq" | "peakRssMB";
type Row = Record<Metric, number> & { bad: number };
type ClientId = (typeof data.clients)[number]["id"];
const scenarios = data.scenarios as Record<string, Record<string, Row>>;
const clients = data.clients;

const color = (i: number) => `var(--viz-${i + 1})`;
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const fmt = (v: number, unit: Unit) => {
  switch (unit) {
    case "s": // from ms: two decimals under 10 s, one above
      return `${(v / 1000).toFixed(v >= 10_000 ? 1 : 2)} s`;
    case "ms":
      return `${nf.format(v)} ms`;
    case "µs":
      return `${Math.round(v).toLocaleString("en-US")} µs`;
    case "MB":
      return `${Math.round(v)} MB`;
    case "req/s":
      return `${Math.round(v).toLocaleString("en-US")} req/s`;
  }
};
type Unit = "s" | "ms" | "µs" | "MB" | "req/s";

/** 0, then 4–5 round steps covering max. */
function ticks(max: number): number[] {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}
/**
 * The element's width in CSS pixels, so charts draw at real size and text
 * stays legible on phones (a scaled viewBox would shrink it). 640 until
 * measured, which is also what the static export renders.
 */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const focusRing =
  "rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fd-ring";

const compact = (v: number) =>
  v >= 1000 ? `${nf.format(v / 1000)}K` : String(v);

/** Short metric names for tooltips (chart titles are too long there). */
const metricLabel: Record<Metric, string> = {
  rps: "requests/s",
  wallMs: "time to finish",
  p50: "median latency",
  p99: "99th percentile",
  cpuUsPerReq: "CPU per request",
  peakRssMB: "peak memory",
};

function LineKey({ i }: { i: number }) {
  return (
    <svg width="14" height="8" aria-hidden className="shrink-0">
      <line
        x1="1"
        x2="13"
        y1="4"
        y2="4"
        stroke={color(i)}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Legend({ shape }: { shape: "line" | "bar" }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fd-muted-foreground">
      {clients.map((c, i) => (
        <span key={c.id} className="inline-flex items-center gap-1.5">
          {shape === "line" ? (
            <LineKey i={i} />
          ) : (
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ background: color(i) }}
            />
          )}
          {c.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Requests per second against requests in flight (50 ms server): the
 * threadpool designs flatten at their thread count, the queue keeps climbing.
 */
export function ThroughputChart() {
  const levels = data.scale.map((s) => ({
    conc: s.conc,
    rows: scenarios[s.name],
  }));
  const [ref, W] = useWidth();
  const H = 300;
  const pad = { l: 48, r: 16, t: 12, b: 44 };
  const pw = W - pad.l - pad.r,
    ph = H - pad.t - pad.b;
  const max = Math.max(
    ...levels.flatMap((l) => clients.map((c) => l.rows[c.id].rps)),
  );
  const ys = ticks(max);
  const top = ys[ys.length - 1];
  const x = (i: number) => pad.l + (pw * i) / (levels.length - 1);
  const y = (v: number) => pad.t + ph - (ph * v) / top;
  const [at, setAt] = useState<number | null>(null);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left - 20;
    setAt(
      Math.max(
        0,
        Math.min(
          levels.length - 1,
          Math.round((px / pw) * (levels.length - 1)),
        ),
      ),
    );
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight")
      setAt((a) => Math.min(levels.length - 1, (a ?? -1) + 1));
    if (e.key === "ArrowLeft") setAt((a) => Math.max(0, (a ?? 1) - 1));
  };
  const last = levels.length - 1;
  const star = clients.length - 1; // the node-tls-client binary: the one end label

  return (
    <figure className="bench-viz not-prose my-6 flex flex-col gap-3">
      <Legend shape="line" />
      <div ref={ref} className="relative">
        <svg
          width={W}
          height={H}
          className={`block overflow-visible ${focusRing}`}
          role="img"
          aria-label="Requests per second at each number of requests in flight, for each version. Values are in the table below."
          tabIndex={0}
          onKeyDown={onKey}
          onFocus={() => setAt((a) => a ?? last)}
          onBlur={() => setAt(null)}
        >
          {ys.map((v) => (
            <g key={v}>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y(v)}
                y2={y(v)}
                stroke={v === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
                strokeWidth="1"
              />
              <text
                x={pad.l - 8}
                y={y(v)}
                dy="0.32em"
                textAnchor="end"
                className="fill-fd-muted-foreground text-[11px] tabular-nums"
              >
                {compact(v)}
              </text>
            </g>
          ))}
          {levels.map((l, i) => (
            <text
              key={l.conc}
              x={x(i)}
              y={H - pad.b + 18}
              textAnchor="middle"
              className="fill-fd-muted-foreground text-[11px] tabular-nums"
            >
              {l.conc.toLocaleString("en-US")}
            </text>
          ))}
          <text
            x={pad.l + pw / 2}
            y={H - 4}
            textAnchor="middle"
            className="fill-fd-muted-foreground text-[11px]"
          >
            Requests in flight
          </text>
          {at !== null && (
            <line
              x1={x(at)}
              x2={x(at)}
              y1={pad.t}
              y2={pad.t + ph}
              stroke="var(--viz-axis)"
              strokeWidth="1"
            />
          )}
          {clients.map((c, ci) => (
            <g key={c.id}>
              <polyline
                points={levels
                  .map((l, i) => `${x(i)},${y(l.rows[c.id].rps)}`)
                  .join(" ")}
                fill="none"
                stroke={color(ci)}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {levels.map((l, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(l.rows[c.id].rps)}
                  r="4"
                  fill={color(ci)}
                  stroke="var(--color-fd-background)"
                  strokeWidth="2"
                />
              ))}
            </g>
          ))}
          <text
            x={x(last) - 8}
            y={y(levels[last].rows[clients[star].id].rps) - 10}
            textAnchor="end"
            className="fill-fd-foreground text-[12px] font-medium tabular-nums"
          >
            {fmt(levels[last].rows[clients[star].id].rps, "req/s")}
          </text>
          <rect
            x={pad.l - 20}
            y={pad.t}
            width={pw + 40}
            height={ph}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setAt(null)}
          />
        </svg>
        {at !== null && (
          <Tooltip
            left={Math.min(Math.max(x(at), 110), W - 110)}
            title={`${levels[at].conc.toLocaleString("en-US")} in flight`}
          >
            {clients.map((c, ci) => (
              <TooltipRow
                key={c.id}
                i={ci}
                label={c.label}
                value={fmt(levels[at].rows[c.id].rps, "req/s")}
              />
            ))}
          </Tooltip>
        )}
      </div>
      <figcaption className="text-sm text-fd-muted-foreground">
        {data.scaleCaption}
      </figcaption>
    </figure>
  );
}

function Tooltip({
  left,
  top = 8,
  title,
  children,
}: {
  left: number;
  top?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border bg-fd-popover px-3 py-2 text-xs shadow-md"
      style={{ left, top }}
      role="status"
    >
      <div className="mb-1 text-fd-muted-foreground">{title}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function TooltipRow({
  i,
  label,
  value,
}: {
  i: number;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <LineKey i={i} />
      <strong className="font-semibold tabular-nums text-fd-foreground">
        {value}
      </strong>
      <span className="text-fd-muted-foreground">{label}</span>
    </div>
  );
}

/** One metric of one scenario, as a bar per client. */
export function BenchBars({
  scenario,
  metric,
  unit,
  title,
  better,
}: {
  scenario: string;
  metric: Metric;
  unit: Unit;
  title: string;
  better: "lower" | "higher";
}) {
  const rows = scenarios[scenario];
  const values = clients.map((c) => rows[c.id][metric]);
  const max = Math.max(...values);
  const [ref, W] = useWidth();
  // Narrow screens put each label above its bar instead of beside it.
  const narrow = W < 520;
  const barH = 20,
    valueW = 96;
  const labelW = narrow ? 0 : 210;
  const rowH = narrow ? 50 : 36;
  const H = rowH * clients.length;
  const bw = (v: number) => Math.max(2, ((W - labelW - valueW) * v) / max);
  const [at, setAt] = useState<number | null>(null);

  return (
    <figure className="bench-viz not-prose my-6 flex flex-col gap-2">
      <figcaption className="text-sm">
        <span className="font-medium text-fd-foreground">{title}</span>{" "}
        <span className="text-fd-muted-foreground">({better} is better)</span>
      </figcaption>
      <div ref={ref} className="relative">
        <svg
          width={W}
          height={H}
          className="block"
          role="img"
          aria-label={`${title}: ${clients.map((c, i) => `${c.label} ${fmt(values[i], unit)}`).join(", ")}`}
        >
          <line
            x1={labelW}
            x2={labelW}
            y1={0}
            y2={H}
            stroke="var(--viz-axis)"
            strokeWidth="1"
          />
          {clients.map((c, i) => {
            const y0 = narrow ? i * rowH + 22 : i * rowH + (rowH - barH) / 2;
            const w = bw(values[i]);
            const r = Math.min(4, w / 2);
            return (
              <g
                key={c.id}
                tabIndex={0}
                className="outline-none"
                aria-label={`${c.label}: ${fmt(values[i], unit)}`}
                onPointerEnter={() => setAt(i)}
                onPointerLeave={() => setAt(null)}
                onFocus={() => setAt(i)}
                onBlur={() => setAt(null)}
              >
                <rect
                  x={0}
                  y={i * rowH}
                  width={W}
                  height={rowH}
                  fill="transparent"
                />
                <text
                  x={narrow ? 0 : labelW - 10}
                  y={narrow ? y0 - 7 : y0 + barH / 2}
                  dy={narrow ? 0 : "0.32em"}
                  textAnchor={narrow ? "start" : "end"}
                  className="fill-fd-muted-foreground text-[12px]"
                >
                  {c.label}
                </text>
                <path
                  d={`M${labelW},${y0} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${barH - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} z`}
                  fill={color(i)}
                  opacity={at === null || at === i ? 1 : 0.55}
                />
                <text
                  x={labelW + w + 8}
                  y={y0 + barH / 2}
                  dy="0.32em"
                  className="fill-fd-foreground text-[12px] font-medium tabular-nums"
                >
                  {fmt(values[i], unit)}
                </text>
              </g>
            );
          })}
        </svg>
        {at !== null && (
          // Below the hovered row, so it doesn't hide the bar it describes.
          <Tooltip
            left={Math.min(Math.max(labelW + bw(values[at]) / 2, 110), W - 110)}
            top={(at + 1) * rowH}
            title={clients[at].label}
          >
            <TooltipRow
              i={at}
              label={metricLabel[metric]}
              value={fmt(values[at], unit)}
            />
            <TooltipRow
              i={at}
              label={metricLabel.p50}
              value={fmt(rows[clients[at].id].p50, "ms")}
            />
            <TooltipRow
              i={at}
              label={metricLabel.p99}
              value={fmt(rows[clients[at].id].p99, "ms")}
            />
          </Tooltip>
        )}
      </div>
    </figure>
  );
}

/** A headline: one metric, 2.1.0's value against the best 2.2.0 one. */
export function BenchStats() {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
      {data.stats.map((s) => {
        const from =
          scenarios[s.scenario][s.from as ClientId][s.metric as Metric];
        const to = scenarios[s.scenario][s.to as ClientId][s.metric as Metric];
        const factor = s.better === "lower" ? from / to : to / from;
        return (
          <div key={s.label} className="rounded-lg border bg-fd-card p-4">
            <div className="text-sm text-fd-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold text-fd-foreground">
              {fmt(from, s.unit as Unit)} → {fmt(to, s.unit as Unit)}
            </div>
            <div className="mt-1 text-sm text-fd-muted-foreground">
              <span className="font-medium text-fd-foreground">
                {factor >= 10 ? Math.round(factor) : nf.format(factor)}×{" "}
                {s.phrase}
              </span>{" "}
              · {s.note}
            </div>
          </div>
        );
      })}
    </div>
  );
}
