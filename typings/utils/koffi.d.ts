import { IClient } from "../interface/client";
/**
 * Downloads and loads the native library.
 * @returns {Promise<IClient>}
 */
export declare function load(): Promise<IClient>;
