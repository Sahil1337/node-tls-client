import { DeleteRequestOptions, GetRequestOptions, HeadRequestOptions, Methods, OptionsRequestOptions, PatchRequestOptions, PostRequestOptions, PutRequestOptions, RequestOptions, SessionOptions } from "../interface";
import { URL } from "url";
import { Response } from "./Response";
export declare class Session {
    private readonly config;
    private jar;
    private sessionId;
    constructor(config?: SessionOptions);
    cookies(): Promise<import("tough-cookie").Cookie.Serialized[]>;
    /**
     * The 'GET' method performs a GET request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the GET request to.
     * @param options - The options for the GET request.
     *
     * @returns The response from the 'execute' method.
     */
    get(url: string, options?: GetRequestOptions): Promise<Response>;
    /**
     * The 'DELETE' method performs a DELETE request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the DELETE request to.
     * @param options - The options for the DELETE request.
     *
     * @returns The response from the 'execute' method.
     */
    delete(url: string, options?: DeleteRequestOptions): Promise<Response>;
    /**
     * The 'OPTIONS' method performs an OPTIONS request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the OPTIONS request to.
     * @param options - The options for the OPTIONS request.
     *
     * @returns The response from the 'execute' method.
     */
    options(url: string, options?: OptionsRequestOptions): Promise<Response>;
    /**
     * The 'HEAD' method performs a HEAD request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the HEAD request to.
     * @param options - The options for the HEAD request.
     *
     * @returns The response from the 'execute' method.
     */
    head(url: string, options?: HeadRequestOptions): Promise<Response>;
    /**
     * The 'POST' method performs a POST request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the POST request to.
     * @param options - The options for the POST request.
     *
     * @returns The response from the 'execute' method.
     */
    post(url: string, options?: PostRequestOptions): Promise<Response>;
    /**
     * The 'PATCH' method performs a PATCH request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the PATCH request to.
     * @param options - The options for the PATCH request.
     *
     * @returns The response from the 'execute' method.
     */
    patch(url: string, options?: PatchRequestOptions): Promise<Response>;
    /**
     * The 'PUT' method performs a PUT request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the PUT request to.
     * @param options - The options for the PUT request.
     *
     * @returns The response from the 'execute' method.
     */
    put(url: string, options?: PutRequestOptions): Promise<Response>;
    /**
     * The 'close' method closes the current session.
     *
     * @returns The response from the 'destroySession' function.
     */
    close(): Promise<any>;
    protected execute(method: Methods, url: string | URL, options?: RequestOptions): Promise<Response>;
    private freeMemory;
    private getDefaultHeaders;
}
