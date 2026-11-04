import * as readline from "readline";

type Stream = NodeJS.WriteStream;

const ANSI = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
} as const;

type Color = keyof typeof ANSI;

const PREFIX = "@node-tls-client ~";
const BAR_WIDTH = 50;

/** Keys already passed to `warnOnce` (process-wide, survives destroyTLS + re-init). */
const warned = new Set<string>();

/** Escape codes only when the target stream is a terminal (keeps CI logs clean). */
function paint(stream: Stream, color: Color, text: string): string {
  return stream.isTTY ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

function line(stream: Stream, level: string, color: Color, args: unknown[]) {
  const prefix = `${paint(stream, "cyan", PREFIX)} ${paint(stream, color, `${level}:`)}`;
  stream.write(`${prefix} ${args.join(" ")}\n`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / 1024 ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Logger utility. Diagnostics (`warn`) go to stderr; progress (`debug`,
 * `success`, `progress`) to stdout.
 */
export const logger = {
  debug: (...args: unknown[]) => line(process.stdout, "DEBUG", "blue", args),
  success: (...args: unknown[]) =>
    line(process.stdout, "SUCCESS", "green", args),
  warn: (...args: unknown[]) => line(process.stderr, "WARN", "yellow", args),
  /** `warn`, at most once per process for each `key`. */
  warnOnce(key: string, ...args: unknown[]) {
    if (warned.has(key)) return;
    warned.add(key);
    logger.warn(...args);
  },
  /** OSC 8 hyperlink on a terminal, plain `text (url)` otherwise. */
  hyperlink: (text: string, url: string) =>
    process.stderr.isTTY
      ? `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`
      : `${text} (${url})`,
  /** Redraws a one-line download bar on stdout; ends the line once `done` reaches `total`. */
  progress(done: number, total: number) {
    const percentage = (done / total) * 100;
    const filled = Math.min(BAR_WIDTH, Math.floor(percentage / 2));
    const bar = "█".repeat(filled) + " ".repeat(BAR_WIDTH - filled);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `${paint(process.stdout, "cyan", PREFIX)} DOWNLOADING:[${bar}] ${percentage.toFixed(2)}% (${formatBytes(done)} / ${formatBytes(total)})${done >= total ? "\n" : ""}`,
    );
  },
};
