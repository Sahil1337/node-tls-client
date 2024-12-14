import workerpool from "workerpool";
import { Client } from "../lib";

const client = new Client();

/**
 * Initialize the client
 */
client.init().then(() => {
  workerpool.worker({
    request: client.request.bind(client),
    destroySession: client.destroySession.bind(client),
    freeMemory: client.freeMemory.bind(client),
  });
});
