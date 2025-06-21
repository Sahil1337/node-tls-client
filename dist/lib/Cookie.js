"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cookies = void 0;
const tough_cookie_1 = require("tough-cookie");
class Cookies extends tough_cookie_1.CookieJar {
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
    async fetchAllCookies() {
        return (await this.serialize()).cookies;
    }
    /**
     * Syncs cookies with the provided URL.
     *
     * @param cookies - An object containing cookies as key-value pairs.
     * @param url - The URL for which cookies are to be set.
     * @returns A promise that resolves to an object containing the synced cookies.
     */
    async syncCookies(cookies, url) {
        if (!cookies)
            return {};
        const result = {};
        await Promise.all(Object.entries(cookies).map(async ([key, value]) => {
            const cookie = await this.setCookie(`${key}=${value}`, url);
            result[cookie.key] = cookie.value;
        }));
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
    async mergeCookies(cookies, url) {
        return Promise.all(Object.entries(cookies).map(async ([key, value]) => {
            const cookie = await this.setCookie(`${key}=${value}`, url);
            return {
                name: cookie.key,
                value: cookie.value,
            };
        }));
    }
}
exports.Cookies = Cookies;
