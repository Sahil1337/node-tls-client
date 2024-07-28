/// <reference types="node" />
import { OutgoingHttpHeaders } from "http";
/**
 * Determines if a request should be treated as a byte request based on its headers.
 *
 * This function checks the "Content-Type" and "Content-Transfer-Encoding" headers
 * to determine if the request is for binary data (such as images, audio, video,
 * application binaries, etc.). If the headers indicate binary data, it returns true.
 *
 * @param {OutgoingHttpHeaders} headers - The headers of the request.
 * @returns {boolean} - Returns true if the request is for binary data, otherwise false.
 */
export declare function isByteRequest(headers: OutgoingHttpHeaders): boolean;
