import * as vscode from "vscode";
import { GitHubRemoteService } from "../github/githubRemote";
import { PullRequestService } from "../github/pullRequestService";
import { CodeReviewComment, CodeReviewSummary, RemoteProvider } from "./types";
import { GitService } from "../git/gitService";

export class GitHubProvider implements RemoteProvider {
  public readonly id = "github";
  private remoteService: GitHubRemoteService;

  public constructor(
    private readonly git: GitService,
    private readonly pullRequestService: PullRequestService
  ) {
    this.remoteService = new GitHubRemoteService(git);
  }

  public async detect(rootPath: string): Promise<boolean> {
    const remote = await this.remoteService.detect(rootPath);
    return !!remote;
  }

  public async getReviews(rootPath: string): Promise<CodeReviewSummary[]> {
    const remote = await this.remoteService.detect(rootPath);
    if (!remote) {
      return [];
    }

    const prs = await this.pullRequestService.listPullRequests(remote);
    return prs.map((pr) => ({
      id: String(pr.number),
      number: pr.number,
      title: pr.title,
      state: pr.state,
      headBranch: pr.headBranch,
      baseBranch: pr.baseBranch,
      headSha: pr.headSha,
      url: pr.url,
      checks: pr.checks,
      providerId: this.id
    }));
  }

  public findReviewForBranch(reviews: CodeReviewSummary[], branchName: string): CodeReviewSummary | undefined {
    const pr = this.pullRequestService.findForBranch(reviews as any, branchName);
    return pr as any;
  }

  public async approve(review: CodeReviewSummary): Promise<void> {
    const rootPath = await this.git.getRepositoryRoot();
    const remote = await this.remoteService.detect(rootPath);
    if (!remote) {
      throw new Error("GitHub remote not found");
    }
    await this.pullRequestService.submitReview(remote, review.number, "APPROVE", "Approved via Code Review Extension");
  }

  public async reject(review: CodeReviewSummary, reason: string): Promise<void> {
    const rootPath = await this.git.getRepositoryRoot();
    const remote = await this.remoteService.detect(rootPath);
    if (!remote) {
      throw new Error("GitHub remote not found");
    }
    await this.pullRequestService.submitReview(remote, review.number, "REQUEST_CHANGES", reason);
  }

  public async comment(review: CodeReviewSummary, comment: CodeReviewComment): Promise<void> {
    const rootPath = await this.git.getRepositoryRoot();
    const remote = await this.remoteService.detect(rootPath);
    if (!remote) {
      throw new Error("GitHub remote not found");
    }

    if (comment.path && comment.line) {
      await this.pullRequestService.createReviewComment(remote, review.number, review.headSha, {
        body: comment.body,
        path: comment.path,
        line: comment.line
      });
    } else {
      await this.pullRequestService.createIssueComment(remote, review.number, comment.body);
    }
  }
}
