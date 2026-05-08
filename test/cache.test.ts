import test from "node:test";
import assert from "node:assert/strict";
import { TimedCache } from "../src/utils/cache";

test("TimedCache stores and clears values", () => {
  const cache = new TimedCache<string>(1000);
  cache.set("a", "value");

  assert.equal(cache.get("a"), "value");
  cache.clear();
  assert.equal(cache.get("a"), undefined);
});
