import * as vscode from "vscode";

const reviewedKey = "codeReview.reviewedCommits";

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
}
