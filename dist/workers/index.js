"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
exports.destroySession = destroySession;
exports.destroyAll = destroyAll;
exports.freeMemory = freeMemory;
const native_1 = require("../utils/native");
const instance = native_1.LibraryHandler.retrieveLibrary();
function request(payload) {
    if (!payload)
        return;
    return instance.request(payload);
}
function destroySession(payload) {
    if (!payload)
        return;
    return instance.destroySession(payload);
}
function destroyAll() {
    return instance.destroyAll();
}
function freeMemory(payload) {
    if (!payload)
        return;
    return instance.freeMemory(payload);
}
exports.default = request;
