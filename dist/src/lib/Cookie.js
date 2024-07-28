"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cookies = void 0;
const tough_cookie_1 = require("tough-cookie");
/**
 * Cookies class extends the CookieJar class from the "tough-cookie" library.
 * It provides methods to manage cookies for a specific URL.
 */
class Cookies extends tough_cookie_1.CookieJar {
    /**
     * Constructor for the Cookies class.
     * It calls the constructor of the parent class CookieJar.
     */
    constructor() {
        super();
    }
    /**
     * Fetches all cookies and organizes them by URL.
     *
     * This method serializes cookies and groups them by their domain and path,
     * constructing a URL as the key and an object of cookies as key-value pairs.
     *
     * @returns An object where keys are URLs and values are objects containing cookies as key-value pairs.
     *
     * @example
     *  {
     *    "https://example.com/": {
     *      "cookie1": "value1",
     *      "cookie2": "value2"
     *    },
     *    "https://anotherdomain.com/": {
     *      "cookieA": "valueA",
     *      "cookieB": "valueB"
     *    }
     *  }
     */
    fetchAllCookies() {
        const cookies = this.serializeSync().cookies;
        return cookies.reduce((acc, cookie) => {
            const url = `https://${cookie.domain}${cookie.path}`;
            if (!acc[url]) {
                acc[url] = {};
            }
            acc[url][cookie.key] = cookie.value;
            return acc;
        }, {});
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
    fetchCookiesObject(url) {
        return this.getCookiesSync(url).reduce((acc, cookie) => {
            acc[cookie.key] = cookie.value;
            return acc;
        }, {});
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
    fetchCookiesList(url) {
        return this.getCookiesSync(url).map((cookie) => ({
            name: cookie.key,
            value: cookie.value,
        }));
    }
    /**
     * Checks and sets cookies for a given URL.
     *
     * @param cookies - An object containing cookies as key-value pairs.
     * @param url - The URL for which cookies are to be set.
     * @returns An object containing cookies as key-value pairs.
     *
     * @example
     * check({ 'cookie1': 'value1', 'cookie2': 'value2' }, 'http://example.com')
     */
    syncCookies(cookies, url) {
        if (!cookies)
            return this.fetchCookiesObject(url);
        for (const [key, value] of Object.entries(cookies)) {
            this.setCookieSync(`${key}=${value}`, url);
        }
        return this.fetchCookiesObject(url);
    }
    /**
     * Merges the provided cookies with the existing cookies for a given URL according to request payload.
     *
     * @param cookies - An object containing cookies as key-value pairs.
     * @param url - The URL for which cookies are to be set.
     * @returns An array of objects, each containing the name and value of a cookie.
     *
     * @example
     * merge({ 'cookie1': 'value1', 'cookie2': 'value2' }, 'http://example.com')
     */
    mergeCookies(cookies, url) {
        for (const [key, value] of Object.entries(cookies)) {
            this.setCookieSync(`${key}=${value}`, url);
        }
        return this.fetchCookiesList(url);
    }
}
exports.Cookies = Cookies;
