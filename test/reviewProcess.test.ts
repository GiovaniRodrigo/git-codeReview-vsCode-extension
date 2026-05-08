import test from "node:test";
import assert from "node:assert/strict";
import { createReviewProcess, reviewProcessDescription } from "../src/productivity/reviewProcess";

test("createReviewProcess stores a branch review target", () => {
  const process = createReviewProcess({
    rootPath: "/repo",
    name: "Feature review",
    ref: { name: "feature/a", kind: "branch", type: "local" },
    now: new Date("2026-05-07T10:00:00.000Z")
  });

  assert.equal(process.rootPath, "/repo");
  assert.equal(process.name, "Feature review");
  assert.equal(process.targetKind, "branch");
  assert.equal(process.ref.name, "feature/a");
  assert.equal(process.status, "active");
  assert.equal(process.createdAt, "2026-05-07T10:00:00.000Z");
  assert.equal(process.updatedAt, "2026-05-07T10:00:00.000Z");
  assert.equal(reviewProcessDescription(process), "active - feature/a");
});

test("createReviewProcess stores a commit review target", () => {
  const process = createReviewProcess({
    rootPath: "/repo",
    ref: { name: "feature/a", kind: "branch", type: "local" },
    commit: {
      hash: "abcdef",
      shortHash: "abc",
      message: "Add feature",
      authorName: "Ada",
      date: "2026-05-07T10:00:00.000Z"
    },
    now: new Date("2026-05-07T10:00:00.000Z")
  });

  assert.equal(process.name, "Review feature/a @ abc");
  assert.equal(process.targetKind, "commit");
  assert.equal(process.commitHash, "abcdef");
  assert.equal(process.commitShortHash, "abc");
  assert.equal(reviewProcessDescription(process), "active - feature/a @ abc");
});
