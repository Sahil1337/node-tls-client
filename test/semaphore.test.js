const test = require("node:test");
const assert = require("node:assert/strict");
const { Semaphore } = require("../dist/transport/ffi/semaphore");

const tick = () => new Promise((r) => setImmediate(r));

test("admits up to `permits`, queues the rest FIFO", async () => {
  const sem = new Semaphore(2);
  const order = [];
  await sem.acquire();
  await sem.acquire();
  let third = false;
  const p3 = sem.acquire().then(() => {
    third = true;
    order.push(3);
  });
  const p4 = sem.acquire().then(() => order.push(4));
  await tick();
  assert.equal(third, false);
  sem.release();
  await p3;
  assert.equal(third, true);
  sem.release();
  await p4;
  assert.deepEqual(order, [3, 4]);
});

test("drain resolves once everything acquired has released", async () => {
  const sem = new Semaphore(1);
  await sem.acquire();
  let drained = false;
  const d = sem.drain().then(() => (drained = true));
  await tick();
  assert.equal(drained, false);
  sem.release();
  await d;
  assert.equal(drained, true);
  await sem.drain(); // idle → resolves immediately
});

test("close rejects new acquires but lets queued ones run", async () => {
  const sem = new Semaphore(1);
  await sem.acquire();
  const queued = sem.acquire();
  const closed = sem.close();
  await assert.rejects(sem.acquire(), { name: "TlsClientError" });
  sem.release(); // hands the permit to `queued`
  await queued;
  sem.release();
  await closed;
});
