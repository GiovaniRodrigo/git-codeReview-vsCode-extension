import * as vscode from "vscode";
import { CommitService } from "../git/commitService";
import { GitRef, CommitSummary } from "../git/types";
import { ReviewState } from "../productivity/reviewState";
import { buildReviewModel, ReviewModel } from "./reviewModel";
import { AIService } from "../ai/aiService";

export class ReviewDocument {
  private _model: ReviewModel | undefined;
  private readonly _onDidChange = new vscode.EventEmitter<ReviewModel>();

  public readonly onDidChange = this._onDidChange.event;

  constructor(
    public readonly rootPath: string,
    public readonly ref: GitRef,
    private readonly commitService: CommitService,
    private readonly reviewState: ReviewState,
    private readonly aiService: AIService,
    private readonly initialCommit?: CommitSummary
  ) {}

  public get model(): ReviewModel | undefined {
    return this._model;
  }

  public async load(): Promise<void> {
    if (this.initialCommit) {
      const details = await this.commitService.getCommitDetails(this.rootPath, this.initialCommit.hash);
      this._model = buildReviewModel(
        this.rootPath,
        this.ref,
        [details],
        this.reviewState.getReviewedFiles(this.rootPath)
      );
    } else {
      const commits = await this.commitService.listCommits(this.rootPath, this.ref.name, 100);
      const details = await Promise.all(
        commits.map((commit) => this.commitService.getCommitDetails(this.rootPath, commit.hash))
      );
      this._model = buildReviewModel(
        this.rootPath,
        this.ref,
        details,
        this.reviewState.getReviewedFiles(this.rootPath)
      );
    }
    this._onDidChange.fire(this._model);
  }

  public async markFileReviewed(hash: string, path: string): Promise<void> {
    await this.reviewState.markFileReviewed(this.rootPath, hash, path);
    
    // Update local model to avoid full reload if possible, 
    // but for now, let's just refresh the model to ensure consistency
    if (this._model) {
      const reviewedFiles = this.reviewState.getReviewedFiles(this.rootPath);
      // We could optimize this by surgically updating the model,
      // but buildReviewModel is fast enough for now.
      // Re-fetching details is NOT needed since we only changed the reviewed state.
      
      // Update the reviewed status in the existing model
      for (const commit of this._model.commits) {
        if (commit.hash === hash) {
          for (const file of commit.files) {
            if (file.path === path) {
              file.reviewed = true;
            }
          }
        }
      }
      
      // Recalculate totals
      let reviewedCount = 0;
      for (const commit of this._model.commits) {
        for (const file of commit.files) {
          if (file.reviewed) reviewedCount++;
        }
      }
      this._model.totals.reviewedFiles = reviewedCount;
      this._model.totals.unreviewedFiles = this._model.totals.files - reviewedCount;
      
      this._onDidChange.fire(this._model);
    }
  }

  public async summarizeCommit(hash: string): Promise<void> {
    if (!this._model) return;

    const commit = this._model.commits.find(c => c.hash === hash);
    if (!commit) return;

    try {
      const details = await this.commitService.getCommitDetails(this.rootPath, hash);
      const diff = await this.commitService.getCommitDiff(this.rootPath, hash);
      
      const summary = await this.aiService.summarizeCommit(hash, details.message, diff);
      if (summary) {
        commit.aiSummary = summary;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`AI Summary failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this._onDidChange.fire(this._model);
    }
  }

  public async analyzeFile(hash: string, path: string): Promise<void> {
    if (!this._model) return;

    const commit = this._model.commits.find(c => c.hash === hash);
    if (!commit) return;

    const file = commit.files.find(f => f.path === path);
    if (!file) return;

    try {
      const diff = await this.commitService.getFileDiff(this.rootPath, hash, path);
      const analysis = await this.aiService.analyzeFile(hash, path, diff);
      
      if (analysis) {
        file.aiSuggestions = analysis.suggestions;
        file.aiBugs = analysis.bugs;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`AI Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this._onDidChange.fire(this._model);
    }
  }

  public dispose(): void {
    this._onDidChange.dispose();
  }
}
