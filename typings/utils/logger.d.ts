/**
 * Logger utility.
 *
 * @property {Function} debug - Logs a debug message.
 * @property {Function} error - Logs an error message.
 * @property {Function} success - Logs a success message.
 * @property {Function} hyperlink - Generates a clickable hyperlink.
 */
export declare const logger: {
    debug: (...args: any[]) => boolean;
    error: (...args: any[]) => boolean;
    success: (...args: any[]) => boolean;
    hyperlink: (text: string, url: string) => string;
    stamp: string;
};
