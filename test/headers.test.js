const test = require("node:test");
const assert = require("node:assert/strict");
const { mergeHeaders, normalizeHeaders } = require("../dist/utils/headers");

test("normalizeHeaders coerces values and drops null/undefined", () => {
  assert.deepEqual(
    normalizeHeaders({ a: 42, b: ["x", "y"], c: null, d: undefined, e: "v" }),
    {
      a: "42",
      b: "x, y",
      e: "v",
    },
  );
});

test("normalizeHeaders collapses duplicate keys case-insensitively (last wins, first position)", () => {
  const out = normalizeHeaders({
    "User-Agent": "A",
    "x-s": "1",
    "user-agent": "B",
  });
  assert.deepEqual(Object.entries(out), [
    ["user-agent", "B"],
    ["x-s", "1"],
  ]);
});

test("merge: request wins per key incl. casing, session-only keys kept", () => {
  const out = mergeHeaders(
    { "User-Agent": "A", "x-s": "1" },
    { "user-agent": "B" },
  );
  assert.deepEqual(Object.entries(out), [
    ["user-agent", "B"],
    ["x-s", "1"],
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
