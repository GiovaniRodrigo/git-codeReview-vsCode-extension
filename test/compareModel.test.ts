import test from "node:test";
import assert from "node:assert/strict";
import { buildCompareModel } from "../src/productivity/compareModel";

test("buildCompareModel aggregates and orders changed files by impact", () => {
  const model = buildCompareModel("/repo", "main", "feature/a", [
    { path: "src/small.ts", status: "modified", additions: 1, deletions: 1 },
    { path: "src/large.ts", status: "added", additions: 30, deletions: 2 },
    { path: "src/new-name.ts", previousPath: "src/old-name.ts", status: "renamed", additions: 3, deletions: 4 }
  ]);

  assert.equal(model.base, "main");
  assert.equal(model.head, "feature/a");
  assert.equal(model.totals.files, 3);
  assert.equal(model.totals.additions, 34);
  assert.equal(model.totals.deletions, 7);
  assert.deepEqual(model.files.map((file) => file.path), ["src/large.ts", "src/new-name.ts", "src/small.ts"]);
});
