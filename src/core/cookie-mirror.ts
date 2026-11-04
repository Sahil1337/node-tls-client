import { CookieJar } from "tough-cookie";
import { RequestCookie } from "../types/payload";

/**
 * JS-side mirror of the cookies seen by one session. Cross-request cookie
 * persistence happens in the native session jar; this mirror only backs
 * `session.cookies()` and never feeds cookies back into requests.
 *
 * Uses tough-cookie's synchronous API: the default in-memory store is
 * synchronous, so no promise is created per cookie.
 */
export class CookieMirror {
  private readonly jar = new CookieJar();

  /**
   * Every cookie recorded by this mirror, in tough-cookie's serialized form
   * (`{ key, value, domain, path, ... }[]`). Domain/path/expiry are inferred
   * from the request URL because native only reports `name=value`.
   */
  all() {
    return this.jar.serializeSync().cookies;
  }

  /**
   * Record the cookies native returned for a response, and return them
   * unchanged (`{}` when native sent none).
   */
  recordResponse(
    cookies: Record<string, string> | null | undefined,
    url: string,
  ): Record<string, string> {
    for (const [name, value] of Object.entries(cookies ?? {})) {
      this.record(name, value, url);
    }
    return cookies ?? {};
  }

  /** Record the per-request cookies sent natively. */
  recordRequest(cookies: RequestCookie[], url: string): void {
    for (const { name, value } of cookies) this.record(name, value, url);
  }

  /**
   * A cookie tough-cookie cannot parse (e.g. odd characters) is simply not
   * mirrored: native still sends or receives it, and a successful response
   * must never be failed by its own cookies.
   */
  private record(name: string, value: string, url: string): void {
    try {
      this.jar.setCookieSync(`${name}=${value}`, url);
    } catch {
      // mirror only
    }
  }
}
