import { CookieJar } from "tough-cookie";

/**
 * Cookies class extends the CookieJar class from the "tough-cookie" library.
 * It provides methods to manage cookies for a specific URL.
 */
export class Cookies extends CookieJar {
  /**
   * Constructor for the Cookies class.
   * It calls the constructor of the parent class CookieJar.
   */
  constructor() {
    super();
  }

  /**
   * Checks and sets cookies for a given URL.
   * If no cookies are provided, it fetches the cookies from the URL.
   *
   * @param cookies - An object containing cookies as key-value pairs.
   * @param url - The URL for which cookies are to be set.
   * @returns An object containing cookies as key-value pairs.
   *
   * @example
   * check({ 'cookie1': 'value1', 'cookie2': 'value2' }, 'http://example.com')
   */
  public async check(cookies: Record<string, string> | null, url: string) {
    if (!cookies) {
      return this.fetchJSON(url);
    }

    for (const [key, value] of Object.entries(cookies)) {
      this.setCookieSync(`${key}=${value}`, url);
    }

    return this.fetchJSON(url);
  }

  /**
   * Fetches the cookies for a given URL as a string.
   *
   * @param url - The URL from which cookies are to be fetched.
   * @returns A string containing the cookies.
   *
   * @example
   * fetchString('http://example.com')
   */
  public fetchString(url: string) {
    return this.getCookieStringSync(url);
  }

  /**
   * Fetches the cookies for a given URL as an object.
   *
   * @param url - The URL from which cookies are to be fetched.
   * @returns An object containing cookies as key-value pairs.
   *
   * @example
   * fetchJSON('http://example.com')
   */
  public fetchJSON(url: string): Record<string, string> {
    return this.getCookiesSync(url).reduce((acc, cookie) => {
      acc[cookie.key] = cookie.value;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Fetches the cookies for a given URL as an array of objects.
   * Each object contains the name and value of a cookie.
   *
   * @param url - The URL from which cookies are to be fetched.
   * @returns An array of objects, each containing the name and value of a cookie.
   *
   * @example
   * fetchSequence('http://example.com')
   */
  public fetchSequence(url: string) {
    return this.getCookiesSync(url).map((cookie) => ({
      name: cookie.key,
      value: cookie.value,
    }));
  }

  /**
   * Merges the provided cookies with the existing cookies for a given URL.
   *
   * @param cookies - An object containing cookies as key-value pairs.
   * @param url - The URL for which cookies are to be set.
   * @returns An array of objects, each containing the name and value of a cookie.
   *
   * @example
   * merge({ 'cookie1': 'value1', 'cookie2': 'value2' }, 'http://example.com')
   */
  public merge(cookies: Record<string, string>, url: string) {
    for (const [key, value] of Object.entries(cookies)) {
      this.setCookieSync(`${key}=${value}`, url);
    }
    return this.fetchSequence(url);
  }
}
