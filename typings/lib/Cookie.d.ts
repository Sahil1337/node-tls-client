import { CookieJar } from "tough-cookie";
/**
 * Cookies class extends the CookieJar class from the "tough-cookie" library.
 * It provides methods to manage cookies for a specific URL.
 */
export declare class Cookies extends CookieJar {
    /**
     * Constructor for the Cookies class.
     * It calls the constructor of the parent class CookieJar.
     */
    constructor();
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
    check(cookies: Record<string, string> | null, url: string): Promise<Record<string, string>>;
    /**
     * Fetches the cookies for a given URL as a string.
     *
     * @param url - The URL from which cookies are to be fetched.
     * @returns A string containing the cookies.
     *
     * @example
     * fetchString('http://example.com')
     */
    fetchString(url: string): string;
    /**
     * Fetches the cookies for a given URL as an object.
     *
     * @param url - The URL from which cookies are to be fetched.
     * @returns An object containing cookies as key-value pairs.
     *
     * @example
     * fetchJSON('http://example.com')
     */
    fetchJSON(url: string): Record<string, string>;
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
    fetchSequence(url: string): {
        name: string;
        value: string;
    }[];
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
    merge(cookies: Record<string, string>, url: string): {
        name: string;
        value: string;
    }[];
}
