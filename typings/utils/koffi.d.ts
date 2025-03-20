import { IClient } from "../interface/client";
/**
 * Loads the native library from the lib directory.
 * @returns {Promise<IClient>}
 */
export declare function load(): Promise<IClient>;
