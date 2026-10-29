import { HeaderInput } from "../interface/session";

type Entry = { key: string; value: string };

/**
 * Apply one header to an ordered entry list, matching existing keys
 * case-insensitively. Later entries win (value AND casing) but keep the first
 * entry's position; `null`/`undefined` removes the header.
 */
function apply(entries: Entry[], key: string, raw: unknown): void {
  const lower = key.toLowerCase();
  const i = entries.findIndex((e) => e.key.toLowerCase() === lower);
  if (raw === null || raw === undefined) {
    if (i >= 0) entries.splice(i, 1);
    return;
  }
  const value = Array.isArray(raw) ? raw.join(", ") : String(raw);
  if (i >= 0) entries[i] = { key, value };
  else entries.push({ key, value });
}

function toEntries(input: HeaderInput | undefined): Entry[] {
  const entries: Entry[] = [];
  for (const [key, raw] of Object.entries(input ?? {}))
    apply(entries, key, raw);
  return entries;
}

function fromEntries(entries: Entry[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of entries) out[key] = value;
  return out;
}

/**
 * Coerce user headers into the `map[string]string` native expects:
 * numbers → strings, arrays → `"a, b"`, `null`/`undefined` → dropped,
 * duplicate keys in different casing collapsed (last wins).
 */
export function normalizeHeaders(input?: HeaderInput): Record<string, string> {
  return fromEntries(toEntries(input));
}

/**
 * Combine session-level and request-level headers (#14): request headers
 * layer over session headers per key (case-insensitive; the request's value
 * and casing win; `null`/`undefined` removes a session header). Returns
 * `undefined` only when NEITHER side supplied a headers object, so the caller
 * can apply library defaults — exactly 2.1.0's rule (an explicit `{}` is
 * honored and sent as `{}`).
 */
export function mergeHeaders(
  session: HeaderInput | undefined,
  request: HeaderInput | undefined,
): Record<string, string> | undefined {
  if (session === undefined && request === undefined) return undefined;
  const entries = toEntries(session);
  for (const [key, raw] of Object.entries(request ?? {}))
    apply(entries, key, raw);
  return fromEntries(entries);
}
