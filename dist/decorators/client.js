"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyClientState = void 0;
const tlsError_1 = require("../utils/tlsError");
function verifyClientState() {
    return function (target, propertyKey, descriptor) {
        const method = descriptor.value;
        descriptor.value = function (...args) {
            if ("isReady" in this && this.isReady && "pool" in this && this.pool) {
                return method.apply(this, args);
            }
            else {
                throw new tlsError_1.TlsClientError("Client is not yet ready.");
            }
        };
        return descriptor;
    };
}
exports.verifyClientState = verifyClientState;
