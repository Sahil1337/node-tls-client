/// <reference types="node" />
import { TlsResponse } from "../interface";
import { IncomingHttpHeaders } from "http";
/**
 * Response class represents the HTTP response received from a server.
 * It provides methods to access various properties of the response.
 */
export declare class Response {
    private readonly response;
    readonly ok: boolean;
    readonly headers: IncomingHttpHeaders;
    readonly status: number;
    readonly url: string;
    /**
     * Constructor for the Response class.
     * Initializes the properties of the class with the values from the provided response object.
     *
     * @param response - The response object from which to initialize the class properties.
     */
    constructor(response: TlsResponse);
    /**
     * Returns the body of the response as a string.
     *
     * @returns A promise that resolves with the body of the response as a string.
     */
    text(): Promise<string>;
    /**
     * Returns the body of the response as a JSON object.
     *
     * @typeparam T - The type of the JSON object.
     * @returns A promise that resolves with the body of the response as a JSON object.
     */
    json<T>(): Promise<T>;
    /**
     * Returns the cookies from the response as an object with key-value pairs.
     *
     * @returns An object containing cookies as key-value pairs.
     */
    get cookies(): Record<string, string>;
}
