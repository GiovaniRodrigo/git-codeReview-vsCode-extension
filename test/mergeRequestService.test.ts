import test from "node:test";
import assert from "node:assert/strict";
import { MergeRequestService } from "../src/gitlab/mergeRequestService";
import { GitLabClientFactory } from "../src/gitlab/gitlabClient";

// Mock SecretStorage
class MockSecretStorage {
  private secrets = new Map<string, string>();
  async get(key: string) { return this.secrets.get(key); }
  async store(key: string, value: string) { this.secrets.set(key, value); }
  async delete(key: string) { this.secrets.delete(key); }
  onDidChange = { event: () => ({ dispose: () => {} }) } as any;
}

test("MergeRequestService.listMergeRequests returns normalized MRs", async (t) => {
  const secrets = new MockSecretStorage();
  const clientFactory = new GitLabClientFactory(secrets as any);
  const service = new MergeRequestService(clientFactory);

  const mockRemote = {
    host: "gitlab.com",
    projectPath: "group/repo",
    apiBaseUrl: "https://gitlab.com/api/v4",
    remoteName: "origin"
  } as any;

  // Mock global fetch
  const originalFetch = global.fetch;
  global.fetch = async (url: any) => {
    assert.ok(url.includes("merge_requests"));
    return {
      ok: true,
      json: async () => [
        {
          iid: 1,
          title: "Test MR",
          state: "opened",
          source_branch: "feature",
          target_branch: "main",
          sha: "abc",
          web_url: "https://gitlab.com/mr/1",
          diff_refs: { base_sha: "base", head_sha: "head", start_sha: "start" }
        }
      ]
    } as any;
  };

  try {
    const mrs = await service.listMergeRequests(mockRemote);
    assert.equal(mrs.length, 1);
    assert.equal(mrs[0].number, 1);
    assert.equal(mrs[0].state, "open");
    assert.equal(mrs[0].headSha, "abc");
  } finally {
    global.fetch = originalFetch;
  }
});

test("MergeRequestService.submitReview calls approve/unapprove endpoints", async (t) => {
  const secrets = new MockSecretStorage();
  const clientFactory = new GitLabClientFactory(secrets as any);
  const service = new MergeRequestService(clientFactory);

  const mockRemote = {
    host: "gitlab.com",
    projectPath: "group/repo",
    apiBaseUrl: "https://gitlab.com/api/v4"
  } as any;

  const calls: string[] = [];
  const originalFetch = global.fetch;
  global.fetch = async (url: any, options: any) => {
    calls.push(`${options.method} ${url}`);
    return { ok: true, status: 204 } as any;
  };

  try {
    await service.submitReview(mockRemote, 1, "APPROVE", "LGTM");
    assert.ok(calls.includes("POST https://gitlab.com/api/v4/projects/group%2Frepo/merge_requests/1/approve"));
    assert.ok(calls.includes("POST https://gitlab.com/api/v4/projects/group%2Frepo/merge_requests/1/notes"));

    calls.length = 0;
    await service.submitReview(mockRemote, 1, "REQUEST_CHANGES", "Fix this");
    assert.ok(calls.includes("POST https://gitlab.com/api/v4/projects/group%2Frepo/merge_requests/1/unapprove"));
    assert.ok(calls.includes("POST https://gitlab.com/api/v4/projects/group%2Frepo/merge_requests/1/notes"));
  } finally {
    global.fetch = originalFetch;
  }
});

test("MergeRequestService.createReviewComment calls discussions endpoint", async (t) => {
  const secrets = new MockSecretStorage();
  const clientFactory = new GitLabClientFactory(secrets as any);
  const service = new MergeRequestService(clientFactory);

  const mockRemote = {
    host: "gitlab.com",
    projectPath: "group/repo",
    apiBaseUrl: "https://gitlab.com/api/v4"
  } as any;

  const mockMR = {
    number: 1,
    diffRefs: { baseSha: "b", headSha: "h", startSha: "s" }
  } as any;

  let body: any;
  const originalFetch = global.fetch;
  global.fetch = async (url: any, options: any) => {
    body = JSON.parse(options.body);
    return { ok: true, json: async () => ({}) } as any;
  };

  try {
    await service.createReviewComment(mockRemote, mockMR, { body: "Nice", path: "file.ts", line: 10 });
    assert.equal(body.body, "Nice");
    assert.equal(body.position.new_path, "file.ts");
    assert.equal(body.position.new_line, 10);
  } finally {
    global.fetch = originalFetch;
  }
});
