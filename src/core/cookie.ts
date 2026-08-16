import { CookieJar } from "tough-cookie";

export class Cookies extends CookieJar {
  constructor() {
    super();
  }

  /**
   * Fetches all cookies and organizes them by URL.
   *
   * This method serializes cookies and groups them by their domain and path,
   * constructing a URL as the key and an object of cookies as key-value pairs.
   *
   * @returns A promise that resolves to an object where keys are URLs and values are objects containing cookies as key-value pairs.
   */
  public async fetchAllCookies() {
    return (await this.serialize()).cookies;
  }

  /**
   * Syncs cookies with the provided URL.
   *
   * @param cookies - An object containing cookies as key-value pairs.
   * @param url - The URL for which cookies are to be set.
   * @returns A promise that resolves to an object containing the synced cookies.
   */
  public async syncCookies(
    cookies: Record<string, string>,
    url: string
  ): Promise<Record<string, string>> {
    if (!cookies) return {};

    const result: Record<string, string> = {};

    await Promise.all(
      Object.entries(cookies).map(async ([key, value]) => {
        const cookie = await this.setCookie(`${key}=${value}`, url);
        result[cookie.key] = cookie.value;
      })
    );

    return result;
  }

  /**
   * Merges the provided cookies with the existing cookies for a given URL according to request payload.
   *
   * @param cookies - An object containing cookies as key-value pairs.
   * @param url - The URL for which cookies are to be set.
   * @returns A promise that resolves to an array of objects, each containing the name and value of a cookie.
   *
   * @example
   * mergeCookies({ 'cookie1': 'value1', 'cookie2': 'value2' }, 'http://example.com')
   */
  public async mergeCookies(cookies: Record<string, string>, url: string) {
    return Promise.all(
      Object.entries(cookies).map(async ([key, value]) => {
        const cookie = await this.setCookie(`${key}=${value}`, url);
        return {
          name: cookie.key,
          value: cookie.value,
        };
      })
    );
  }
}
