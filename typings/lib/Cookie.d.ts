import { CookieJar } from "tough-cookie";
export declare class Cookies extends CookieJar {
    constructor();
    /**
     * Fetches all cookies and organizes them by URL.
     *
     * This method serializes cookies and groups them by their domain and path,
     * constructing a URL as the key and an object of cookies as key-value pairs.
     *
     * @returns A promise that resolves to an object where keys are URLs and values are objects containing cookies as key-value pairs.
     */
    fetchAllCookies(): Promise<import("tough-cookie").Cookie.Serialized[]>;
    /**
     * Syncs cookies with the provided URL.
     *
     * @param cookies - An object containing cookies as key-value pairs.
     * @param url - The URL for which cookies are to be set.
     * @returns A promise that resolves to an object containing the synced cookies.
     */
    syncCookies(cookies: Record<string, string>, url: string): Promise<Record<string, string>>;
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
    mergeCookies(cookies: Record<string, string>, url: string): Promise<{
        name: string;
        value: string;
    }[]>;
}
