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
  assert.equal(model.totals.highRiskFiles, 0);
  assert.equal(model.totals.reviewedFiles, 0);
  assert.equal(model.totals.unreviewedFiles, 3);
  assert.deepEqual(model.authors, ["Ada", "Linus"]);
  assert.deepEqual(model.refs, ["main"]);
  assert.deepEqual(model.files, ["src/a.ts", "src/b.ts"]);
  assert.equal(model.commits[0].refName, "main");
  assert.equal(model.commits[0].additions, 12);
  assert.equal(model.commits[0].deletions, 1);
  assert.equal(model.commits[0].risk, "low");
  assert.equal(model.commits[0].files[0].category, "source");
  assert.equal(model.commits[0].files[0].reviewed, false);
});

test("buildReviewModel prioritizes risky files and exposes review reasons", () => {
  const commits: CommitDetails[] = [
    {
      hash: "abc",
      shortHash: "abc",
      message: "Update dependencies and docs",
      authorName: "Ada",
      date: "2026-05-07T10:00:00Z",
      files: [
        { path: "docs/usage.md", status: "modified", additions: 80, deletions: 10 },
        { path: "package-lock.json", status: "modified", additions: 350, deletions: 160 },
        { path: "src/runtime.ts", status: "modified", additions: 8, deletions: 1 }
      ]
    }
  ];

  const model = buildReviewModel("/repo", { name: "main", kind: "branch", type: "local" }, commits);

  assert.equal(model.totals.highRiskFiles, 1);
  assert.equal(model.commits[0].risk, "high");
  assert.equal(model.commits[0].reviewReason, "large change, dependency or lockfile");
  assert.equal(model.commits[0].files[0].path, "package-lock.json");
  assert.equal(model.commits[0].files[0].category, "dependency");
  assert.equal(model.commits[0].files[0].risk, "high");
  assert.equal(model.commits[0].files[2].path, "src/runtime.ts");
});

test("buildReviewModel marks reviewed files from local review state", () => {
  const commits: CommitDetails[] = [
    {
      hash: "abc",
      shortHash: "abc",
      message: "Add feature",
      authorName: "Ada",
      date: "2026-05-07T10:00:00Z",
      files: [
        { path: "src/a.ts", status: "added", additions: 10, deletions: 0 },
        { path: "src/b.ts", status: "modified", additions: 2, deletions: 1 }
      ]
    }
  ];

  const model = buildReviewModel("/repo", { name: "main", kind: "branch", type: "local" }, commits, new Set(["abc:src/b.ts"]));

  assert.equal(model.totals.reviewedFiles, 1);
  assert.equal(model.totals.unreviewedFiles, 1);
  assert.equal(model.commits[0].files.find((file) => file.path === "src/b.ts")?.reviewed, true);
});
