"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
/**
 * Response class represents the HTTP response received from a server.
 * It provides methods to access various properties of the response.
 */
class Response {
    response;
    // The 'ok' property is a boolean indicating whether the response was successful (status in the range 200-299) or not.
    ok;
    // The 'headers' property is an object representing the response headers.
    headers;
    // The 'status' property is a number representing the HTTP status code of the response.
    status;
    // The 'url' property is a string representing the URL of the response.
    url;
    /**
     * Constructor for the Response class.
     * It initializes the properties of the class with the values from the provided response object.
     *
     * @param response - The response object from which to initialize the class properties.
     */
    constructor(response) {
        this.response = response;
        this.ok = response.status >= 200 && response.status < 300 ? true : false;
        this.headers = response.headers;
        this.status = response.status;
        this.url = response.target;
    }
    /**
     * The 'text' method returns the body of the response as a string.
     *
     * @returns The body of the response as a string.
     *
     * @example
     * const response = new Response(someResponseType);
     * const text = response.text();
     */
    text() {
        return Buffer.from(this.response?.body).toString("utf-8");
    }
    /**
     * The 'json' method returns the body of the response as a JSON object.
     *
     * @returns The body of the response as a JSON object.
     *
     * @example
     * const response = new Response(someResponseType);
     * const json = response.json();
     */
    json() {
        return JSON.parse(this.response?.body);
    }
    /**
     * The 'cookies' method returns the cookies from the response.
     *
     * @returns The cookies from the response.
     *
     * @example
     * const response = new Response(someResponseType);
     * const cookies = response.cookies();
     */
    async cookies() {
        return this.response.cookies;
    }
}
exports.Response = Response;
