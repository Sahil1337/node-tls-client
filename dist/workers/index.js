"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freeMemory = exports.destroyAll = exports.destroySession = exports.request = void 0;
const native_1 = require("../utils/native");
const instance = native_1.LibraryHandler.retrieveLibrary();
function request(payload) {
    if (!payload)
        return;
    return instance.request(payload);
}
exports.request = request;
function destroySession(payload) {
    if (!payload)
        return;
    return instance.destroySession(payload);
}
exports.destroySession = destroySession;
function destroyAll() {
    return instance.destroyAll();
}
exports.destroyAll = destroyAll;
function freeMemory(payload) {
    if (!payload)
        return;
    return instance.freeMemory(payload);
}
exports.freeMemory = freeMemory;
exports.default = request;
