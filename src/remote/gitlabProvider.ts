import * as vscode from "vscode";
import { GitLabRemoteService } from "../gitlab/gitlabRemote";
import { MergeRequestService } from "../gitlab/mergeRequestService";
import { CodeReviewComment, CodeReviewSummary, RemoteProvider } from "./types";
import { GitService } from "../git/gitService";

export class GitLabProvider implements RemoteProvider {
  public readonly id = "gitlab";
  private remoteService: GitLabRemoteService;

  public constructor(
    private readonly git: GitService,
    private readonly mergeRequestService: MergeRequestService
  ) {
    this.remoteService = new GitLabRemoteService(git);
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

    const mrs = await this.mergeRequestService.listMergeRequests(remote);
    return mrs.map((mr) => ({
      id: String(mr.number),
      number: mr.number,
      title: mr.title,
      state: mr.state,
      headBranch: mr.headBranch,
      baseBranch: mr.baseBranch,
      headSha: mr.headSha,
      url: mr.url,
      providerId: this.id
    }));
  }

  public findReviewForBranch(reviews: CodeReviewSummary[], branchName: string): CodeReviewSummary | undefined {
    const mr = this.mergeRequestService.findForBranch(reviews as any, branchName);
    return mr as any;
  }

  public async approve(review: CodeReviewSummary): Promise<void> {
    const rootPath = await this.git.getRepositoryRoot();
    const remote = await this.remoteService.detect(rootPath);
    if (!remote) {
      throw new Error("GitLab remote not found");
    }
    await this.mergeRequestService.submitReview(remote, review.number, "APPROVE", "Approved via Code Review Extension");
  }

  public async reject(review: CodeReviewSummary, reason: string): Promise<void> {
    const rootPath = await this.git.getRepositoryRoot();
    const remote = await this.remoteService.detect(rootPath);
    if (!remote) {
      throw new Error("GitLab remote not found");
    }
    await this.mergeRequestService.submitReview(remote, review.number, "REQUEST_CHANGES", reason);
  }

  public async comment(review: CodeReviewSummary, comment: CodeReviewComment): Promise<void> {
    const rootPath = await this.git.getRepositoryRoot();
    const remote = await this.remoteService.detect(rootPath);
    if (!remote) {
      throw new Error("GitLab remote not found");
    }

    if (comment.path && comment.line) {
      // GitLab needs diffRefs for line comments, which should be in the review summary if available
      const mrs = await this.mergeRequestService.listMergeRequests(remote);
      const mr = mrs.find(m => m.number === review.number);
      if (mr) {
        await this.mergeRequestService.createReviewComment(remote, mr, {
          body: comment.body,
          path: comment.path,
          line: comment.line
        });
      } else {
        await this.mergeRequestService.createNote(remote, review.number, comment.body);
      }
    } else {
      await this.mergeRequestService.createNote(remote, review.number, comment.body);
    }
  }
}
