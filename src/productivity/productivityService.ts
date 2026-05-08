import * as vscode from "vscode";
import { BranchService } from "../git/branchService";
import { CommitService } from "../git/commitService";
import { GitService } from "../git/gitService";
import { CommitSummary } from "../git/types";
import { ReviewState } from "./reviewState";

export class ProductivityService {
  public constructor(
    private readonly git: GitService,
    private readonly branchService: BranchService,
    private readonly commitService: CommitService,
    private readonly reviewState: ReviewState
  ) {}

  public async compareBranches(rootPath: string): Promise<void> {
    const branches = await this.branchService.listLocalBranches(rootPath);
    const names = branches.map((branch) => branch.name);
    const base = await vscode.window.showQuickPick(names, { title: "Base branch" });
    if (!base) {
      return;
    }
    const head = await vscode.window.showQuickPick(names.filter((name) => name !== base), { title: "Head branch" });
    if (!head) {
      return;
    }

    const output = await this.git.run(["diff", "--stat", `${base}...${head}`], rootPath);
    const document = await vscode.workspace.openTextDocument({
      language: "text",
      content: output || `Sem diferencas entre ${base} e ${head}.`
    });
    await vscode.window.showTextDocument(document, { preview: true });
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
