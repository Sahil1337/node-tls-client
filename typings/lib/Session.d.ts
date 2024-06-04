import { sessionOptions, GetRequestOptions, PostRequestOptions, PatchRequestOptions, PutRequestOptions, DeleteRequestOptions, OptionsRequestOptions, HeadRequestOptions } from "../interface";
import { Response } from ".";
/**
 * Session class represents a HTTP session.
 * It provides methods to perform various HTTP requests.
 */
export declare class Session {
    private sessionId?;
    private proxy?;
    private clientIdentifier?;
    private ja3string?;
    private h2Settings?;
    private h2SettingsOrder?;
    private supportedSignatureAlgorithms?;
    private supportedVersions?;
    private keyShareCurves?;
    private certCompressionAlgo?;
    private pseudoHeaderOrder?;
    private connectionFlow?;
    private priorityFrames?;
    private headerOrder?;
    private headerPriority?;
    private randomTlsExtensionOrder?;
    private forceHttp1?;
    private debug?;
    private insecureSkipVerify?;
    private headers;
    private alpnProtocols?;
    private alpsProtocols;
    private jar;
    private fetch;
    constructor(options?: sessionOptions);
    /**
     * The 'close' method closes the current session.
     *
     * @returns The response from the 'destroySession' function.
     */
    close(): Promise<any>;
    /**
     * The 'freeMemory' method frees the memory used by the session with the provided id.
     *
     * @param id - The id of the session to free the memory of.
     *
     * @returns The response from the 'destroySession' function.
     */
    private free;
    /**
     * The 'get' method performs a GET request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the GET request to.
     * @param options - The options for the GET request.
     *
     * @returns The response from the 'execute' method.
     */
    get(url: string, options?: GetRequestOptions): Promise<Response>;
    /**
     * The 'delete' method performs a DELETE request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the DELETE request to.
     * @param options - The options for the DELETE request.
     *
     * @returns The response from the 'execute' method.
     */
    delete(url: string, options?: DeleteRequestOptions): Promise<Response>;
    /**
     * The 'options' method performs an OPTIONS request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the OPTIONS request to.
     * @param options - The options for the OPTIONS request.
     *
     * @returns The response from the 'execute' method.
     */
    options(url: string, options?: OptionsRequestOptions): Promise<Response>;
    /**
     * The 'head' method performs a HEAD request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the HEAD request to.
     * @param options - The options for the HEAD request.
     *
     * @returns The response from the 'execute' method.
     */
    head(url: string, options?: HeadRequestOptions): Promise<Response>;
    /**
     * The 'post' method performs a POST request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the POST request to.
     * @param options - The options for the POST request.
     *
     * @returns The response from the 'execute' method.
     */
    post(url: string, options?: PostRequestOptions): Promise<Response>;
    /**
     * The 'patch' method performs a PATCH request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the PATCH request to.
     * @param options - The options for the PATCH request.
     *
     * @returns The response from the 'execute' method.
     */
    patch(url: string, options?: PatchRequestOptions): Promise<Response>;
    /**
     * The 'put' method performs a PUT request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the PUT request to.
     * @param options - The options for the PUT request.
     *
     * @returns The response from the 'execute' method.
     */
    put(url: string, options?: PutRequestOptions): Promise<Response>;
    /**
     * The 'execute' method performs a HTTP request of the provided method to the provided URL with the provided options.
     *
     * @param method - The HTTP method of the request.
     * @param url - The URL to perform the request to.
     * @param options - The options for the request.
     *
     * @returns A new Response object.
     */
    private execute;
}
