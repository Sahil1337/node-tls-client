"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyTLS = exports.initTLS = void 0;
const Client_1 = require("./Client");
async function initTLS() {
    return Client_1.Client.init();
}
exports.initTLS = initTLS;
async function destroyTLS() {
    return Client_1.Client.destroy();
}
exports.destroyTLS = destroyTLS;
