import { TlsResponse } from "../interface";
import { IncomingHttpHeaders } from "http";
export declare class Response {
    ok: boolean;
    headers: IncomingHttpHeaders;
    status: number;
    url: string;
    body: string;
    cookies: Record<string, string>;
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
    json<T extends unknown>(): Promise<T>;
}
