import test from "node:test";
import assert from "node:assert/strict";
import { parseGitHubRemotes } from "../src/github/githubRemote";

test("parseGitHubRemotes detects https and ssh remotes", () => {
  const remotes = parseGitHubRemotes([
    "origin\thttps://github.com/example/repo.git (fetch)",
    "origin\thttps://github.com/example/repo.git (push)",
    "upstream\tgit@github.com:owner/project.git (fetch)"
  ].join("\n"));

  assert.deepEqual(remotes, [
    {
      owner: "example",
      repo: "repo",
      remoteName: "origin",
      url: "https://github.com/example/repo.git"
    },
    {
      owner: "owner",
      repo: "project",
      remoteName: "upstream",
      url: "git@github.com:owner/project.git"
    }
  ]);
});
