"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TlsClientError = void 0;
class TlsClientError extends Error {
    constructor(message) {
        super(message instanceof Error ? message.message : message);
        if (message instanceof Error && message.stack) {
            this.stack = message.stack;
        }
        this.name = "TlsClientError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.TlsClientError = TlsClientError;
