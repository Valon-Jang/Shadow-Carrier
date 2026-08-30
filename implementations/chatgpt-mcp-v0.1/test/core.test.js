import test from "node:test";
import assert from "node:assert/strict";
import { TransitionTable } from "../src/transition-table.js";
import { HiddenCache } from "../src/cache.js";


test("transition table predicts highest-confidence observed next action", () => {
  const t = new TransitionTable();
  t.record("A", "B", { url: "https://example.com/b", maxChars: 40000 });
  t.record("A", "B", { url: "https://example.com/b", maxChars: 40000 });
  t.record("A", "C", { url: "https://example.com/c", maxChars: 40000 });
  const top = t.top("A", 3, 0);
  assert.equal(top[0].next, "B");
  assert.equal(top[0].confidence, 2 / 3);
});

test("negative cache suppresses repeatedly wrong transitions", () => {
  const t = new TransitionTable();
  t.record("A", "B", { url: "https://example.com/b", maxChars: 40000 });
  t.recordMiss("A", "B");
  t.recordMiss("A", "B");
  t.recordMiss("A", "B");
  assert.deepEqual(t.top("A", 3, 0), []);
});

test("hidden cache expires by ttl", () => {
  const c = new HiddenCache({ ttlMs: 10 });
  c.set("x", "y", 100);
  assert.equal(c.get("x", 105), "y");
  assert.equal(c.get("x", 111), null);
});
