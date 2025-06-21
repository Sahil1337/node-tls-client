import { Piscina } from "piscina";
export declare class Client {
    private static instance;
    private static ready;
    private static readyPromise;
    private _pool;
    private constructor();
    static init(): Promise<void>;
    static destroy(): Promise<void>;
    static getInstance(): Client;
    get pool(): Piscina;
    static isReady(): boolean;
}
