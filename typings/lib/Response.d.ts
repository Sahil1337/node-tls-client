/// <reference types="node" />
import { response as ResponseType } from "../interface";
import { IncomingHttpHeaders } from "http";
/**
 * Response class represents the HTTP response received from a server.
 * It provides methods to access various properties of the response.
 */
export declare class Response {
    private response;
    ok: boolean;
    headers: IncomingHttpHeaders;
    status: number;
    url: string;
    /**
     * Constructor for the Response class.
     * It initializes the properties of the class with the values from the provided response object.
     *
     * @param response - The response object from which to initialize the class properties.
     */
    constructor(response: ResponseType);
    /**
     * The 'text' method returns the body of the response as a string.
     *
     * @returns The body of the response as a string.
     *
     * @example
     * const response = new Response(someResponseType);
     * const text = response.text();
     */
    text(): string;
    /**
     * The 'json' method returns the body of the response as a JSON object.
     *
     * @returns The body of the response as a JSON object.
     *
     * @example
     * const response = new Response(someResponseType);
     * const json = response.json();
     */
    json<T>(): T;
    /**
     * The 'cookies' method returns the cookies from the response.
     *
     * @returns The cookies from the response.
     *
     * @example
     * const response = new Response(someResponseType);
     * const cookies = response.cookies();
     */
    cookies(): Promise<Object>;
}
