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
    async check(cookies, url) {
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
    fetchString(url) {
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
    fetchJSON(url) {
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
    fetchSequence(url) {
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
    merge(cookies, url) {
        for (const [key, value] of Object.entries(cookies)) {
            this.setCookieSync(`${key}=${value}`, url);
        }
        return this.fetchSequence(url);
    }
}
exports.Cookies = Cookies;
