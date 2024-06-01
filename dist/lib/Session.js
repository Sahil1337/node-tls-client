"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const crypto_1 = require("crypto");
const _1 = require(".");
const koffi_1 = require("../utils/koffi");
// Version of the current session.
const __version__ = "1";
/**
 * Session class represents a HTTP session.
 * It provides methods to perform various HTTP requests.
 */
class Session {
    sessionId;
    proxy;
    clientIdentifier;
    ja3string;
    h2Settings;
    h2SettingsOrder;
    supportedSignatureAlgorithms;
    supportedVersions;
    keyShareCurves;
    certCompressionAlgo;
    pseudoHeaderOrder;
    connectionFlow;
    priorityFrames;
    headerOrder;
    headerPriority;
    randomTlsExtensionOrder;
    forceHttp1;
    debug;
    insecureSkipVerify;
    headers;
    alpnProtocols;
    alpsProtocols;
    jar = new _1.Cookies();
    /**
     * Constructor for the Session class.
     * It initializes the properties of the class with the values from the provided options object.
     *
     * @param options - The options object from which to initialize the class properties.
     */
    constructor(options) {
        this.sessionId = (0, crypto_1.randomUUID)();
        this.proxy = "";
        this.alpnProtocols = options?.alpnProtocols
            ? options?.alpnProtocols
            : ["h2", "http/1.1"];
        this.alpsProtocols = options?.alpsProtocols
            ? options?.alpsProtocols
            : ["http/1.1"];
        this.headers = options?.headers
            ? options.headers
            : {
                "User-Agent": `tls-client/${__version__}`,
                "Accept-Encoding": "gzip, deflate, br",
                Accept: "*/*",
                Connection: "keep-alive",
            };
        this.clientIdentifier = options?.clientIdentifier;
        this.ja3string = options?.ja3string;
        this.h2Settings = options?.h2Settings;
        this.h2SettingsOrder = options?.h2SettingsOrder;
        this.supportedSignatureAlgorithms = options?.supportedSignatureAlgorithms;
        this.supportedVersions = options?.supportedVersions;
        this.keyShareCurves = options?.keyShareCurves;
        this.certCompressionAlgo = options?.certCompressionAlgo;
        this.pseudoHeaderOrder = options?.pseudoHeaderOrder;
        this.connectionFlow = options?.connectionFlow;
        this.priorityFrames = options?.priorityFrames;
        this.headerOrder = options?.headerOrder;
        this.headerPriority = options?.headerPriority;
        this.randomTlsExtensionOrder = options?.randomTlsExtensionOrder || false;
        this.forceHttp1 = options?.forceHttp1 || false;
        this.debug = options?.debug || false;
        this.insecureSkipVerify = options?.insecureSkipVerify || false;
    }
    /**
     * The 'close' method closes the current session.
     *
     * @returns The response from the 'destroySession' function.
     */
    close() {
        const payload = JSON.stringify({
            sessionId: this.sessionId,
        });
        const response = JSON.parse((0, koffi_1.destroySession)(payload));
        this.free(response.id);
        return response;
    }
    /**
     * The 'freeMemory' method frees the memory used by the session with the provided id.
     *
     * @param id - The id of the session to free the memory of.
     *
     * @returns The response from the 'destroySession' function.
     */
    free(id) {
        return (0, koffi_1.freeMemory)(id);
    }
    /**
     * The 'get' method performs a GET request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the GET request to.
     * @param options - The options for the GET request.
     *
     * @returns The response from the 'execute' method.
     */
    async get(url, options) {
        return this.execute("GET", url, {
            headers: options?.headers,
            redirect: options?.redirect,
            rejectUnauthorized: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : false,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            timeout: options?.timeout,
            proxy: options?.proxy,
            cookies: options?.cookies,
        });
    }
    /**
     * The 'delete' method performs a DELETE request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the DELETE request to.
     * @param options - The options for the DELETE request.
     *
     * @returns The response from the 'execute' method.
     */
    async delete(url, options) {
        return this.execute("DELETE", url, {
            headers: options?.headers,
            redirect: options?.redirect,
            rejectUnauthorized: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : false,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            timeout: options?.timeout,
            proxy: options?.proxy,
            cookies: options?.cookies,
        });
    }
    /**
     * The 'options' method performs an OPTIONS request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the OPTIONS request to.
     * @param options - The options for the OPTIONS request.
     *
     * @returns The response from the 'execute' method.
     */
    async options(url, options) {
        return this.execute("OPTIONS", url, {
            headers: options?.headers,
            redirect: options?.redirect,
            rejectUnauthorized: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : false,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            timeout: options?.timeout,
            proxy: options?.proxy,
            cookies: options?.cookies,
        });
    }
    /**
     * The 'head' method performs a HEAD request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the HEAD request to.
     * @param options - The options for the HEAD request.
     *
     * @returns The response from the 'execute' method.
     */
    async head(url, options) {
        return this.execute("HEAD", url, {
            headers: options?.headers,
            redirect: options?.redirect,
            rejectUnauthorized: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : false,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            timeout: options?.timeout,
            proxy: options?.proxy,
            cookies: options?.cookies,
        });
    }
    /**
     * The 'post' method performs a POST request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the POST request to.
     * @param options - The options for the POST request.
     *
     * @returns The response from the 'execute' method.
     */
    async post(url, options) {
        return this.execute("POST", url, {
            body: options?.body,
            headers: options?.headers,
            redirect: options?.redirect,
            rejectUnauthorized: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : false,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            timeout: options?.timeout,
            proxy: options?.proxy,
            cookies: options?.cookies,
        });
    }
    /**
     * The 'patch' method performs a PATCH request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the PATCH request to.
     * @param options - The options for the PATCH request.
     *
     * @returns The response from the 'execute' method.
     */
    async patch(url, options) {
        return this.execute("PATCH", url, {
            body: options?.body,
            headers: options?.headers,
            redirect: options?.redirect,
            rejectUnauthorized: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : false,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            timeout: options?.timeout,
            proxy: options?.proxy,
            cookies: options?.cookies,
        });
    }
    /**
     * The 'put' method performs a PUT request to the provided URL with the provided options.
     *
     * @param url - The URL to perform the PUT request to.
     * @param options - The options for the PUT request.
     *
     * @returns The response from the 'execute' method.
     */
    async put(url, options) {
        return this.execute("PUT", url, {
            body: options?.body,
            headers: options?.headers,
            redirect: options?.redirect,
            rejectUnauthorized: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : false,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            timeout: options?.timeout,
            proxy: options?.proxy,
            cookies: options?.cookies,
        });
    }
    /**
     * The 'execute' method performs a HTTP request of the provided method to the provided URL with the provided options.
     *
     * @param method - The HTTP method of the request.
     * @param url - The URL to perform the request to.
     * @param options - The options for the request.
     *
     * @returns A new Response object.
     */
    async execute(method, url, options) {
        let headers = options?.headers ? options?.headers : this.headers;
        let requestCookies = [];
        if (options?.cookies) {
            requestCookies = this.jar.merge(options.cookies, url);
        }
        let skeletonPayload = {
            sessionId: this.sessionId,
            followRedirects: options?.redirect ? options.redirect : false,
            forceHttp1: this.forceHttp1,
            withDebug: this.debug,
            headers,
            headerOrder: this.headerOrder,
            insecureSkipVerify: options?.rejectUnauthorized
                ? options?.rejectUnauthorized
                : this.insecureSkipVerify,
            additionalDecode: options?.additionalDecode
                ? options?.additionalDecode
                : false,
            proxyUrl: options?.proxy ? options?.proxy : this.proxy,
            requestUrl: url,
            requestMethod: method,
            requestBody: options?.body,
            requestCookies: requestCookies,
            timeoutMillisecond: options?.timeout ? options?.timeout : 30000,
            withRandomTLSExtensionOrder: this.randomTlsExtensionOrder,
        };
        if (this.clientIdentifier) {
            skeletonPayload["tlsClientIdentifier"] = this.clientIdentifier;
        }
        else if (this.ja3string) {
            skeletonPayload["customTlsClient"] = {
                ja3String: this.ja3string,
                h2Settings: this.h2Settings,
                h2SettingsOrder: this.h2SettingsOrder,
                pseudoHeaderOrder: this.pseudoHeaderOrder,
                connectionFlow: this.connectionFlow,
                priorityFrames: this.priorityFrames,
                headerPriority: this.headerPriority,
                certCompressionAlgo: this.certCompressionAlgo,
                supportedVersions: this.supportedVersions,
                supportedSignatureAlgorithms: this.supportedSignatureAlgorithms,
                keyShareCurves: this.keyShareCurves,
                alpnProtocols: this.alpnProtocols,
                alpsProtocols: this.alpsProtocols,
            };
        }
        else
            skeletonPayload["tlsClientIdentifier"] = "chrome_120";
        const requestPayloadString = JSON.stringify(skeletonPayload);
        const res = (0, koffi_1.request)(requestPayloadString);
        if (!res)
            throw new Error("No response from the server.");
        const response = JSON.parse(res);
        let cookies = this.jar.check(response.cookies, url);
        this.free(response.id);
        return new _1.Response({ ...response, cookies });
    }
}
exports.Session = Session;
