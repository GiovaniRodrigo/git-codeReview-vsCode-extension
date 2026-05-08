import test from "node:test";
import assert from "node:assert/strict";
import { parseGitLabRemotes } from "../src/gitlab/gitlabRemote";

test("parseGitLabRemotes detects https and ssh GitLab remotes", () => {
  const remotes = parseGitLabRemotes([
    "origin\thttps://gitlab.com/example/repo.git (fetch)",
    "origin\thttps://gitlab.com/example/repo.git (push)",
    "upstream\tgit@gitlab.com:group/subgroup/project.git (fetch)"
  ].join("\n"));

  assert.deepEqual(remotes, [
    {
      host: "gitlab.com",
      projectPath: "example/repo",
      owner: "example",
      repo: "repo",
      remoteName: "origin",
      url: "https://gitlab.com/example/repo.git",
      webUrl: "https://gitlab.com/example/repo",
      apiBaseUrl: "https://gitlab.com/api/v4"
    },
    {
      host: "gitlab.com",
      projectPath: "group/subgroup/project",
      owner: "group/subgroup",
      repo: "project",
      remoteName: "upstream",
      url: "git@gitlab.com:group/subgroup/project.git",
      webUrl: "https://gitlab.com/group/subgroup/project",
      apiBaseUrl: "https://gitlab.com/api/v4"
    }
  ]);
});
