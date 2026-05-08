import { GitHubRemote } from "../git/types";
import { GitHubClientFactory } from "./githubClient";
import { CheckSummary, PullRequestState, PullRequestSummary, ReviewCommentDraft } from "./types";

export class PullRequestService {
  public constructor(private readonly clientFactory: GitHubClientFactory) {}

  public async listPullRequests(remote: GitHubRemote): Promise<PullRequestSummary[]> {
    const client = await this.clientFactory.create(false);
    const { data } = await client.pulls.list({
      owner: remote.owner,
      repo: remote.repo,
      state: "all",
      per_page: 100,
      sort: "updated",
      direction: "desc"
    });

    const prs = await Promise.all(data.map(async (pr) => ({
      number: pr.number,
      title: pr.title,
      state: normalizePullRequestState(pr.draft, pr.merged_at, pr.state),
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      headSha: pr.head.sha,
      url: pr.html_url,
      checks: await this.listChecks(remote, pr.head.sha)
    } satisfies PullRequestSummary)));

    return prs;
  }

  public async listChecks(remote: GitHubRemote, ref: string): Promise<CheckSummary[]> {
    const client = await this.clientFactory.create(false);
    const checks: CheckSummary[] = [];

    try {
      const { data } = await client.checks.listForRef({
        owner: remote.owner,
        repo: remote.repo,
        ref,
        per_page: 50
      });
      checks.push(...data.check_runs.map((check) => ({
        name: check.name,
        status: check.status,
        conclusion: check.conclusion ?? undefined,
        url: check.html_url ?? undefined
      })));
    } catch {
      // Some repositories do not expose Checks API for the authenticated user.
    }

    try {
      const { data } = await client.repos.getCombinedStatusForRef({
        owner: remote.owner,
        repo: remote.repo,
        ref
      });
      checks.push(...data.statuses.map((status) => ({
        name: status.context,
        status: status.state,
        conclusion: status.state,
        url: status.target_url ?? undefined
      })));
    } catch {
      // Status API may also be unavailable; PR listing should still work.
    }

    return checks;
  }

  public findForBranch(pullRequests: PullRequestSummary[], branchName: string): PullRequestSummary | undefined {
    const shortName = branchName.replace(/^origin\//, "");
    return pullRequests.find((pr) => pr.headBranch === shortName || pr.headBranch === branchName);
  }

  public async submitReview(remote: GitHubRemote, pullNumber: number, event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT", body: string): Promise<void> {
    const client = await this.clientFactory.create(true);
    await client.pulls.createReview({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      event,
      body
    });
  }

  public async createIssueComment(remote: GitHubRemote, pullNumber: number, body: string): Promise<void> {
    const client = await this.clientFactory.create(true);
    await client.issues.createComment({
      owner: remote.owner,
      repo: remote.repo,
      issue_number: pullNumber,
      body
    });
  }

  public async createReviewComment(remote: GitHubRemote, pullNumber: number, commitId: string, comment: ReviewCommentDraft): Promise<void> {
    if (!comment.path || !comment.line) {
      await this.createIssueComment(remote, pullNumber, comment.body);
      return;
    }

    const client = await this.clientFactory.create(true);
    await client.pulls.createReviewComment({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      commit_id: commitId,
      path: comment.path,
      line: comment.line,
      body: comment.body
    });
  }
}

function normalizePullRequestState(isDraft: boolean | undefined, mergedAt: string | null | undefined, state: string): PullRequestState {
  if (isDraft) {
    return "draft";
  }
  if (mergedAt) {
    return "merged";
  }
  return state === "closed" ? "closed" : "open";
}
