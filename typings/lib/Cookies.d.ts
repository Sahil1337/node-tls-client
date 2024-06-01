import { CookieJar } from "tough-cookie";
export declare class Cookies extends CookieJar {
    constructor();
    check(cookies: Record<string, string> | null, url: string): Promise<Record<string, string>>;
    fetchString(url: string): string;
    fetchJSON(url: string): Record<string, string>;
    fetchSequence(url: string): {
        name: string;
        value: string;
    }[];
    merge(cookies: Record<string, string>, url: string): {
        name: string;
        value: string;
    }[];
}
