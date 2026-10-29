const test = require("node:test");
const assert = require("node:assert/strict");
const { mergeHeaders } = require("../dist/utils/headers");

test("merge: request wins per key incl. casing, session-only keys kept; values coerced", () => {
  const out = mergeHeaders(
    { "User-Agent": "A", "x-s": "1" },
    { "user-agent": "B", n: 42, list: ["x", "y"] },
  );
  assert.deepEqual(Object.entries(out), [
    ["user-agent", "B"],
    ["x-s", "1"],
    ["n", "42"],
    ["list", "x, y"],
  ]);
});

test("merge: null/undefined in the request removes a session header", () => {
  assert.deepEqual(mergeHeaders({ "x-s": "1", keep: "k" }, { "X-S": null }), {
    keep: "k",
  });
  assert.deepEqual(mergeHeaders({ "x-s": "1" }, { "x-s": undefined }), {});
});

test("merge: undefined only when neither side supplied headers; explicit {} honored", () => {
  assert.equal(mergeHeaders(undefined, undefined), undefined);
  assert.deepEqual(mergeHeaders({}, {}), {});
  assert.deepEqual(mergeHeaders({}, undefined), {});
  assert.deepEqual(mergeHeaders(undefined, { a: "1" }), { a: "1" });
});
