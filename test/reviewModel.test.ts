import test from "node:test";
import assert from "node:assert/strict";
import { buildReviewModel } from "../src/review/reviewModel";
import { CommitDetails } from "../src/git/types";

test("buildReviewModel aggregates authors files and stats", () => {
  const commits: CommitDetails[] = [
    {
      hash: "abc",
      shortHash: "abc",
      message: "Add feature",
      authorName: "Ada",
      authorEmail: "ada@example.com",
      date: "2026-05-07T10:00:00Z",
      files: [
        { path: "src/a.ts", status: "added", additions: 10, deletions: 0 },
        { path: "src/b.ts", status: "modified", additions: 2, deletions: 1 }
      ]
    },
    {
      hash: "def",
      shortHash: "def",
      message: "Fix feature",
      authorName: "Linus",
      date: "2026-05-07T11:00:00Z",
      files: [{ path: "src/b.ts", status: "modified", additions: 1, deletions: 3 }]
    }
  ];

  const model = buildReviewModel("/repo", { name: "main", kind: "branch", type: "local" }, commits);

  assert.equal(model.totals.commits, 2);
  assert.equal(model.totals.files, 2);
  assert.equal(model.totals.additions, 13);
  assert.equal(model.totals.deletions, 4);
  assert.deepEqual(model.authors, ["Ada", "Linus"]);
  assert.deepEqual(model.refs, ["main"]);
  assert.deepEqual(model.files, ["src/a.ts", "src/b.ts"]);
  assert.equal(model.commits[0].refName, "main");
  assert.equal(model.commits[0].additions, 12);
  assert.equal(model.commits[0].deletions, 1);
});
