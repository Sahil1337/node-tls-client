type Stream = NodeJS.WriteStream;

const ANSI = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
} as const;

type Color = keyof typeof ANSI;

/** Escape codes only when the target stream is a terminal (keeps CI logs clean). */
function paint(stream: Stream, color: Color, text: string): string {
  return stream.isTTY ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

function line(stream: Stream, level: string, color: Color, args: unknown[]) {
  const prefix = `${paint(stream, "cyan", "@node-tls-client ~")} ${paint(stream, color, `${level}:`)}`;
  return stream.write(`${prefix} ${args.join(" ")}\n`);
}

/**
 * Logger utility. Diagnostics (`warn`, `error`) go to stderr; progress
 * (`debug`, `success`) to stdout.
 */
export const logger = {
  debug: (...args: unknown[]) => line(process.stdout, "DEBUG", "blue", args),
  success: (...args: unknown[]) =>
    line(process.stdout, "SUCCESS", "green", args),
  warn: (...args: unknown[]) => line(process.stderr, "WARN", "yellow", args),
  error: (...args: unknown[]) => line(process.stderr, "ERROR", "red", args),
  /** OSC 8 hyperlink on a terminal, plain `text (url)` otherwise. */
  hyperlink: (text: string, url: string) =>
    process.stderr.isTTY
      ? `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`
      : `${text} (${url})`,
  get stamp() {
    return paint(process.stdout, "cyan", "@node-tls-client ~");
  },
};
