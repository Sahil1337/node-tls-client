// Queue mode (node-tls-client's binary) against a stubbed completion queue:
// requests finish when a test says so, and "native" calls the registered
// handler the way setNotify does. No native code involved.
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { setClient } = require("../dist/native/runtime");
const { QueueClient } = require("../dist/native/client");
const { TlsClientError, destroyTLS } = require("../dist");

const tick = () => new Promise((r) => setImmediate(r));

function queueStub() {
  let nextTicket = 1;
  const finished = []; // completions not collected yet
  const stub = {
    started: [], // { ticket, url }
    freed: [],
    handlers: [], // every onReady() argument, in order
    polls: 0,
    destroyAllCalls: 0,
    async request() {
      throw new Error("queue mode must not call request()");
    },
    freeMemory(id) {
      stub.freed.push(id);
    },
    async destroyAll() {
      stub.destroyAllCalls++;
      return JSON.stringify({ id: "all", success: true });
    },
    async destroySession(json) {
      return JSON.stringify({ id: `d-${JSON.parse(json).sessionId}` });
    },
    // No waitNextAsync: queue mode must not touch the threadpool.
    queue: {
      requestAsync(json) {
        const ticket = nextTicket++;
        stub.started.push({ ticket, url: JSON.parse(json).requestUrl });
        return ticket;
      },
      waitNext(timeoutMs) {
        assert.equal(timeoutMs, 0, "never blocks the main thread");
        stub.polls++;
        if (stub.failNextPoll) {
          const e = stub.failNextPoll;
          stub.failNextPoll = null;
          throw e;
        }
        return finished.shift() ?? null;
      },
      onReady(handler) {
        stub.handlers.push(handler);
        // Like setNotify: installing a handler makes native call it if
        // anything finished is still uncollected.
        if (handler && finished.length) setImmediate(() => stub.handler?.());
      },
    },
    get handler() {
      return stub.handlers.at(-1) ?? null;
    },
    /** Finish `ticket` (its response echoes the URL); native is not told yet. */
    finish(ticket, url = stub.started.find((s) => s.ticket === ticket)?.url) {
      const response = JSON.stringify({
        id: `r${ticket}`,
        status: 200,
        body: url,
      });
      finished.push({ ticket, response });
    },
    /** Native's callback, as setNotify makes it. */
    notify() {
      stub.handler?.();
    },
  };
  return stub;
}

function install(stub) {
  const client = new QueueClient(stub);
  setClient(client);
  return client;
}

const send = (client, url) => client.request({ requestUrl: url });

test.afterEach(() => {
  setClient(null);
});

test("one callback settles every finished request, out of order, each with its own response", async () => {
  const stub = queueStub();
  const client = install(stub);
  assert.equal(stub.handlers.length, 1, "the client registers a handler");
  const urls = ["https://a.test/1", "https://a.test/2", "https://a.test/3"];
  const results = urls.map((u) => send(client, u));
  await tick();
  assert.deepEqual(
    stub.started.map((s) => s.ticket),
    [1, 2, 3],
  );
  stub.finish(3);
  stub.finish(1);
  stub.finish(2);
  stub.notify();
  const bodies = (await Promise.all(results)).map((r) => r.body);
  assert.deepEqual(bodies, urls);
  assert.deepEqual(stub.freed.sort(), ["r1", "r2", "r3"]);
  assert.equal(stub.polls, 4, "three completions, then one empty poll");
});

test("nothing settles until native calls back; a callback with nothing finished is harmless", async () => {
  const stub = queueStub();
  const client = install(stub);
  let settled = false;
  const p = send(client, "https://a.test/1").then((r) => {
    settled = true;
    return r;
  });
  await tick();
  stub.notify(); // e.g. the call setNotify schedules
  stub.finish(1);
  await tick();
  assert.equal(settled, false);
  stub.notify();
  assert.equal((await p).body, "https://a.test/1");
});

test("the process is held open only while requests wait", async () => {
  const stub = queueStub();
  const client = install(stub);
  assert.equal(client.recheck, null, "idle: nothing held");
  const first = send(client, "https://a.test/1");
  const second = send(client, "https://a.test/2");
  await tick();
  assert.notEqual(client.recheck, null);
  stub.finish(1);
  stub.notify();
  await first;
  assert.notEqual(client.recheck, null, "one still waiting");
  stub.finish(2);
  stub.notify();
  await second;
  assert.equal(client.recheck, null);
});

test("a lost callback costs a delay, not a hang: while requests wait, native is asked to check again", async () => {
  const stub = queueStub();
  const client = install(stub);
  const p = send(client, "https://a.test/1");
  await tick();
  stub.finish(1); // finished, but native's callback never comes
  const t0 = Date.now();
  assert.equal((await p).body, "https://a.test/1");
  const waited = Date.now() - t0;
  assert.ok(waited >= 200 && waited < 1000, `settled after ${waited} ms`);
  assert.equal(client.recheck, null, "stops once nothing waits");
});

test("a script that only fires requests stays alive for its response, then exits", () => {
  // koffi's callback from native doesn't keep Node alive; here an unref'd
  // timer plays native, so only the client's keep-alive can hold the process.
  const child = `
    const { setClient } = require("./dist/native/runtime");
    const { QueueClient } = require("./dist/native/client");
    let handler, done;
    const lib = {
      freeMemory() {},
      queue: {
        requestAsync() { setTimeout(() => { done = true; handler(); }, 300).unref(); return 1; },
        waitNext() { return done ? (done = false, { ticket: 1, response: '{"id":"r1","status":200,"body":"ok"}' }) : null; },
        onReady(h) { handler = h; },
      },
    };
    const client = new QueueClient(lib);
    setClient(client);
    client.request({ requestUrl: "https://a.test/" }).then((r) => console.log(r.body));
  `;
  const out = spawnSync(process.execPath, ["-e", child], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), "ok");
});

test("a response for an unknown ticket is freed, not delivered", async () => {
  const stub = queueStub();
  const client = install(stub);
  const p = send(client, "https://a.test/1");
  await tick();
  stub.finish(999, "stray");
  stub.finish(1);
  stub.notify();
  assert.equal((await p).body, "https://a.test/1");
  assert.ok(stub.freed.includes("r999"));
});

test("no cap: every request starts at once", async () => {
  const stub = queueStub();
  const client = install(stub);
  const all = Array.from({ length: 500 }, (_, i) =>
    send(client, `https://a.test/${i}`),
  );
  await tick();
  assert.equal(stub.started.length, 500);
  for (const { ticket } of stub.started) stub.finish(ticket);
  stub.notify();
  assert.equal((await Promise.all(all)).length, 500);
});

test("destroyTLS() waits for queued requests, rejects new ones, clears native state, then removes its handler", async () => {
  const stub = queueStub();
  const client = install(stub);
  const inFlight = send(client, "https://a.test/1");
  await tick();
  let destroyed = false;
  const destroying = destroyTLS().then(() => (destroyed = true));
  await tick();
  assert.equal(destroyed, false);
  await assert.rejects(send(client, "https://a.test/late"), {
    name: "TlsClientError",
  });
  assert.equal(stub.destroyAllCalls, 0);

  stub.finish(1);
  stub.notify();
  assert.equal((await inFlight).body, "https://a.test/1");
  await destroying;
  assert.equal(stub.destroyAllCalls, 1);
  assert.equal(stub.handler, null, "native stops calling back");
  assert.equal(client.recheck, null);
});

test("a client made after destroyTLS() installs its own handler", async () => {
  const stub = queueStub();
  install(stub);
  await destroyTLS();
  const next = install(stub);
  assert.equal(stub.handlers.length, 3);
  assert.equal(typeof stub.handlers[0], "function");
  assert.equal(stub.handlers[1], null);
  assert.equal(typeof stub.handlers[2], "function");
  assert.notEqual(stub.handlers[2], stub.handlers[0]);
  const p = send(next, "https://a.test/again");
  await tick();
  stub.finish(1);
  stub.notify();
  assert.equal((await p).body, "https://a.test/again");
});

test("a koffi failure while collecting fails every waiting request", async () => {
  const stub = queueStub();
  const client = install(stub);
  const results = [
    send(client, "https://a.test/1"),
    send(client, "https://a.test/2"),
  ];
  await tick();
  stub.failNextPoll = new Error("koffi broke");
  stub.notify(); // the handler must not throw back into koffi
  for (const p of results) {
    await assert.rejects(p, (e) => {
      assert.ok(e instanceof TlsClientError);
      assert.equal(e.message, "koffi broke");
      return true;
    });
  }
  assert.equal(client.recheck, null);
  // The next callback works again; the failed callers' replies are freed.
  const next = send(client, "https://a.test/3");
  await tick();
  stub.finish(1);
  stub.finish(3);
  stub.notify();
  assert.equal((await next).body, "https://a.test/3");
  assert.ok(stub.freed.includes("r1"));
});
