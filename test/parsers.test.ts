import test from "node:test";
import assert from "node:assert/strict";
import { parseBranchList, parseCommitFiles, parseCommitLog, parseTagList } from "../src/git/parsers";

test("parseBranchList normalizes branches", () => {
  const branches = parseBranchList("main\u001forigin/main\u001fabc123\nfeature/a\u001f\u001fdef456", "local");

  assert.deepEqual(branches, [
    { name: "main", type: "local", upstream: "origin/main", headCommit: "abc123" },
    { name: "feature/a", type: "local", upstream: undefined, headCommit: "def456" }
  ]);
});

test("parseTagList reads tag targets", () => {
  assert.deepEqual(parseTagList("v1.0.0\u001fabc123"), [{ name: "v1.0.0", targetCommit: "abc123" }]);
});

test("parseCommitLog reads stable field-separated git log", () => {
  const commits = parseCommitLog("abc123\u001fabc123\u001fInitial commit\u001fAda\u001fada@example.com\u001f2026-05-07T10:00:00Z");

  assert.deepEqual(commits, [
    {
      hash: "abc123",
      shortHash: "abc123",
      message: "Initial commit",
      authorName: "Ada",
      authorEmail: "ada@example.com",
      date: "2026-05-07T10:00:00Z"
    }
  ]);
});

test("parseCommitFiles maps status and stats", () => {
  const files = parseCommitFiles(
    ["A\tsrc/new.ts", "M\tsrc/existing.ts", "D\tsrc/old.ts", "R100\tsrc/a.ts\tsrc/b.ts"].join("\n"),
    ["3\t0\tsrc/new.ts", "4\t2\tsrc/existing.ts", "0\t8\tsrc/old.ts", "1\t1\tsrc/{a.ts => b.ts}"].join("\n")
  );

  assert.deepEqual(files, [
    { path: "src/new.ts", previousPath: undefined, status: "added", additions: 3, deletions: 0 },
    { path: "src/existing.ts", previousPath: undefined, status: "modified", additions: 4, deletions: 2 },
    { path: "src/old.ts", previousPath: undefined, status: "deleted", additions: 0, deletions: 8 },
    { path: "src/b.ts", previousPath: "src/a.ts", status: "renamed", additions: 1, deletions: 1 }
  ]);
});
