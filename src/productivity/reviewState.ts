import * as vscode from "vscode";
import { reviewedFileId } from "./reviewIds";

const reviewedKey = "codeReview.reviewedCommits";
const reviewedFilesKey = "codeReview.reviewedFiles";

export class ReviewState {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public getReviewed(rootPath: string): Set<string> {
    const state = this.context.workspaceState.get<Record<string, string[]>>(reviewedKey, {});
    return new Set(state[rootPath] ?? []);
  }

  public isReviewed(rootPath: string, hash: string): boolean {
    return this.getReviewed(rootPath).has(hash);
  }

  public async markReviewed(rootPath: string, hash: string): Promise<void> {
    const state = this.context.workspaceState.get<Record<string, string[]>>(reviewedKey, {});
    const reviewed = new Set(state[rootPath] ?? []);
    reviewed.add(hash);
    await this.context.workspaceState.update(reviewedKey, {
      ...state,
      [rootPath]: [...reviewed]
    });
  }

  public getReviewedFiles(rootPath: string): Set<string> {
    const state = this.context.workspaceState.get<Record<string, string[]>>(reviewedFilesKey, {});
    return new Set(state[rootPath] ?? []);
  }

  public isFileReviewed(rootPath: string, hash: string, path: string): boolean {
    return this.getReviewedFiles(rootPath).has(reviewedFileId(hash, path));
  }

  public async markFileReviewed(rootPath: string, hash: string, path: string): Promise<void> {
    const state = this.context.workspaceState.get<Record<string, string[]>>(reviewedFilesKey, {});
    const reviewed = new Set(state[rootPath] ?? []);
    reviewed.add(reviewedFileId(hash, path));
    await this.context.workspaceState.update(reviewedFilesKey, {
      ...state,
      [rootPath]: [...reviewed]
    });
  }
}
