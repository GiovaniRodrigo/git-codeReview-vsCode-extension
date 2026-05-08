import * as vscode from "vscode";
import { BranchService } from "../git/branchService";
import { CommitService } from "../git/commitService";
import { GitService } from "../git/gitService";
import { CommitSummary } from "../git/types";
import { parseCommitFiles } from "../git/parsers";
import { buildCompareModel } from "./compareModel";
import { ComparePanel } from "./comparePanel";
import { ReviewState } from "./reviewState";

export class ProductivityService {
  public constructor(
    private readonly git: GitService,
    private readonly branchService: BranchService,
    private readonly commitService: CommitService,
    private readonly reviewState: ReviewState
  ) {}

  public async compareBranches(rootPath: string): Promise<void> {
    const [localBranches, remoteBranches] = await Promise.all([
      this.branchService.listLocalBranches(rootPath),
      this.branchService.listRemoteBranches(rootPath)
    ]);
    const names = [...new Set([...localBranches, ...remoteBranches].map((branch) => branch.name))].sort((left, right) => left.localeCompare(right));
    const base = await vscode.window.showQuickPick(names, { title: "Base branch" });
    if (!base) {
      return;
    }
    const head = await vscode.window.showQuickPick(names.filter((name) => name !== base), { title: "Head branch" });
    if (!head) {
      return;
    }

    const [nameStatusOutput, numstatOutput] = await Promise.all([
      this.git.run(["diff", "--name-status", "-M", "-C", `${base}...${head}`], rootPath),
      this.git.run(["diff", "--numstat", "-M", "-C", `${base}...${head}`], rootPath)
    ]);
    ComparePanel.open(buildCompareModel(rootPath, base, head, parseCommitFiles(nameStatusOutput, numstatOutput)));
  }

  public async showUnreviewed(rootPath: string, ref = "HEAD"): Promise<void> {
    const commits = await this.commitService.listCommits(rootPath, ref, 100);
    const unreviewed = commits.filter((commit) => !this.reviewState.isReviewed(rootPath, commit.hash));
    await this.showCommitList(unreviewed, "Unreviewed commits");
  }

  private async showCommitList(commits: CommitSummary[], title: string): Promise<void> {
    const document = await vscode.workspace.openTextDocument({
      language: "markdown",
      content: [
        `# ${title}`,
        "",
        ...commits.map((commit) => `- \`${commit.shortHash}\` ${commit.message} - ${commit.authorName}`)
      ].join("\n")
    });
    await vscode.window.showTextDocument(document, { preview: true });
  }
}
