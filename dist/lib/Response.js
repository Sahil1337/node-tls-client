"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
class Response {
    // Indicates whether the response was successful (status in the range 200-299) or not.
    ok;
    // Represents the response headers.
    headers;
    // Represents the HTTP status code of the response.
    status;
    // Represents the URL of the response.
    url;
    // The response body
    body;
    // The cookies from the response
    cookies;
    constructor(response) {
        this.ok = response.status >= 200 && response.status < 300;
        this.headers = response.headers;
        this.status = response.status;
        this.url = response.target;
        this.body = response.body;
        this.cookies = response.cookies;
    }
    /**
     * Returns the body of the response as a string.
     *
     * @returns A promise that resolves with the body of the response as a string.
     */
    async text() {
        return this.body;
    }
    /**
     * Returns the body of the response as a JSON object.
     *
     * @typeparam T - The type of the JSON object.
     * @returns A promise that resolves with the body of the response as a JSON object.
     */
    async json() {
        return JSON.parse(this.body);
    }
}
exports.Response = Response;
