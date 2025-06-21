"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTLS = initTLS;
exports.destroyTLS = destroyTLS;
const Client_1 = require("./Client");
async function initTLS() {
    return Client_1.Client.init();
}
async function destroyTLS() {
    return Client_1.Client.destroy();
}
