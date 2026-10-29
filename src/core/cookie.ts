import { CookieJar } from "tough-cookie";

/**
 * JS-side mirror of the cookies seen by this session. Cross-request cookie
 * persistence happens in the native session jar; this jar only backs
 * `session.cookies()` and never feeds cookies back into requests.
 */
export class Cookies extends CookieJar {
  /**
   * Every cookie recorded by this mirror, in tough-cookie's serialized form
   * (`{ key, value, domain, path, ... }[]`). Domain/path/expiry are inferred
   * from the request URL because native only reports `name=value`.
   */
  public async fetchAllCookies() {
    return (await this.serialize()).cookies;
  }

  /**
   * Record the cookies native returned for a response. Always returns
   * native's `name → value` map unchanged; a cookie the mirror cannot parse
   * is kept in the result and simply not mirrored (a successful response must
   * never be failed by its own cookies).
   */
  public async syncCookies(
    cookies: Record<string, string> | null | undefined,
    url: string,
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(cookies ?? {})) {
      result[key] = value;
      try {
        await this.setCookie(`${key}=${value}`, url);
      } catch {
        // unparseable by tough-cookie (e.g. odd characters); mirror only
      }
    }
    return result;
  }

  /**
   * Return per-request cookies in the shape native expects (`[{ name, value }]`)
   * with values passed through verbatim (a Set-Cookie parser would cut a value
   * at the first `;`), and record them in the mirror when parseable.
   */
  public async mergeCookies(
    cookies: Record<string, string | number>,
    url: string,
  ): Promise<{ name: string; value: string }[]> {
    const result: { name: string; value: string }[] = [];
    for (const [key, raw] of Object.entries(cookies)) {
      const value = String(raw);
      result.push({ name: key, value });
      try {
        await this.setCookie(`${key}=${value}`, url);
      } catch {
        // mirror only; native receives the cookie regardless
      }
    }
    return result;
  }
}
