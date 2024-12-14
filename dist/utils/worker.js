"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const workerpool_1 = __importDefault(require("workerpool"));
const lib_1 = require("../lib");
const client = new lib_1.Client();
/**
 * Initialize the client
 */
client.init().then(() => {
    workerpool_1.default.worker({
        request: client.request.bind(client),
        destroySession: client.destroySession.bind(client),
        freeMemory: client.freeMemory.bind(client),
    });
});
