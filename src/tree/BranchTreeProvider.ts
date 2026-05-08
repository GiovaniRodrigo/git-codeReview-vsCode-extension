import * as vscode from "vscode";
import { BranchService } from "../git/branchService";
import { CommitService } from "../git/commitService";
import { BranchSummary, CommitFileChange, CommitSummary, GitHubRemote, GitRef, TagSummary } from "../git/types";
import { GitHubRemoteService } from "../github/githubRemote";
import { PullRequestService } from "../github/pullRequestService";
import { CheckSummary, PullRequestSummary } from "../github/types";
import { formatCommitDate, formatFileStats, formatFileStatus } from "../utils/format";

export type CodeReviewTreeItem = RefGroupNode | BranchNode | TagNode | PullRequestNode | CheckNode | CommitNode | FileNode | MessageNode;

export class BranchTreeProvider implements vscode.TreeDataProvider<CodeReviewTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CodeReviewTreeItem | undefined | void>();
  public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private rootPath?: string;
  private githubRemote?: GitHubRemote;
  private pullRequests: PullRequestSummary[] = [];

  public constructor(
    private readonly branchService: BranchService,
    private readonly commitService: CommitService,
    private readonly githubRemoteService?: GitHubRemoteService,
    private readonly pullRequestService?: PullRequestService
  ) {}

  public async setRepository(rootPath: string): Promise<void> {
    this.rootPath = rootPath;
    await this.refreshGitHubState();
    this.refresh();
  }

  public clearRepository(): void {
    this.rootPath = undefined;
    this.githubRemote = undefined;
    this.pullRequests = [];
    this.refresh();
  }

  public refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
  }

  public getTreeItem(element: CodeReviewTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: CodeReviewTreeItem): Promise<CodeReviewTreeItem[]> {
    if (!this.rootPath) {
      return [new MessageNode("Nenhum repositorio Git aberto")];
    }

    if (!element) {
      return [
        new RefGroupNode("Branches locais", "local"),
        new RefGroupNode("Branches remotas", "remote"),
        new RefGroupNode("Tags", "tag"),
        new RefGroupNode("Pull Requests", "pullRequest")
      ];
    }

    if (element instanceof RefGroupNode) {
      return this.getRefGroupChildren(element);
    }

    if (element instanceof BranchNode || element instanceof TagNode) {
      const commits = await this.commitService.listCommits(this.rootPath, element.ref.name);
      const nodes: CodeReviewTreeItem[] = [];
      if (element instanceof BranchNode) {
        const pullRequest = this.pullRequestService?.findForBranch(this.pullRequests, element.branch.name);
        if (pullRequest && this.githubRemote) {
          nodes.push(new PullRequestNode(this.rootPath, this.githubRemote, pullRequest));
        }
      }
      nodes.push(...commits.map((commit) => new CommitNode(this.rootPath!, element.ref, commit)));
      return nodes;
    }

    if (element instanceof PullRequestNode) {
      return [
        ...element.pullRequest.checks.map((check) => new CheckNode(check)),
        ...(await this.commitService.listCommits(this.rootPath, element.pullRequest.headBranch)).map((commit) => new CommitNode(this.rootPath!, {
          name: element.pullRequest.headBranch,
          kind: "branch",
          type: "remote"
        }, commit))
      ];
    }

    if (element instanceof CommitNode) {
      const files = await this.commitService.listChangedFiles(this.rootPath, element.commit.hash);
      return files.map((file) => new FileNode(this.rootPath!, element.commit, file));
    }

    return [];
  }

  private async getRefGroupChildren(group: RefGroupNode): Promise<CodeReviewTreeItem[]> {
    if (!this.rootPath) {
      return [];
    }

    if (group.kind === "tag") {
      const tags = await this.branchService.listTags(this.rootPath);
      return tags.length > 0 ? tags.map((tag) => new TagNode(this.rootPath!, tag)) : [new MessageNode("Nenhuma tag encontrada")];
    }

    if (group.kind === "pullRequest") {
      if (!this.githubRemote) {
        return [new MessageNode("Nenhum remote GitHub detectado")];
      }

      return this.pullRequests.length > 0
        ? this.pullRequests.map((pullRequest) => new PullRequestNode(this.rootPath!, this.githubRemote!, pullRequest))
        : [new MessageNode("Nenhum pull request encontrado ou autenticacao ausente")];
    }

    const branches = group.kind === "local"
      ? await this.branchService.listLocalBranches(this.rootPath)
      : await this.branchService.listRemoteBranches(this.rootPath);

    return branches.length > 0 ? branches.map((branch) => new BranchNode(this.rootPath!, branch)) : [new MessageNode("Nenhuma branch encontrada")];
  }

  private async refreshGitHubState(): Promise<void> {
    this.githubRemote = undefined;
    this.pullRequests = [];

    if (!this.rootPath || !this.githubRemoteService || !this.pullRequestService) {
      return;
    }

    try {
      this.githubRemote = await this.githubRemoteService.detect(this.rootPath);
      if (this.githubRemote) {
        this.pullRequests = await this.pullRequestService.listPullRequests(this.githubRemote);
      }
    } catch {
      this.pullRequests = [];
    }
  }
}

export class RefGroupNode extends vscode.TreeItem {
  public constructor(
    label: string,
    public readonly kind: "local" | "remote" | "tag" | "pullRequest"
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = "refGroup";
    this.iconPath = new vscode.ThemeIcon(kind === "tag" ? "tag" : kind === "pullRequest" ? "git-pull-request" : "git-branch");
  }
}

export class BranchNode extends vscode.TreeItem {
  public readonly ref: GitRef;

  public constructor(
    public readonly rootPath: string,
    public readonly branch: BranchSummary
  ) {
    super(branch.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.ref = { name: branch.name, kind: "branch", type: branch.type };
    this.description = branch.type;
    this.tooltip = branch.upstream ? `${branch.name} -> ${branch.upstream}` : branch.name;
    this.contextValue = "branch reviewable";
    this.iconPath = new vscode.ThemeIcon("git-branch");
  }
}

export class TagNode extends vscode.TreeItem {
  public readonly ref: GitRef;

  public constructor(
    public readonly rootPath: string,
    public readonly tag: TagSummary
  ) {
    super(tag.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.ref = { name: tag.name, kind: "tag" };
    this.description = tag.targetCommit;
    this.contextValue = "tag reviewable";
    this.iconPath = new vscode.ThemeIcon("tag");
  }
}

export class CommitNode extends vscode.TreeItem {
  public constructor(
    public readonly rootPath: string,
    public readonly ref: GitRef,
    public readonly commit: CommitSummary
  ) {
    super(`${commit.shortHash} ${commit.message}`, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = commit.authorName;
    this.tooltip = `${commit.hash}\n${commit.authorName} <${commit.authorEmail ?? ""}>\n${formatCommitDate(commit.date)}`;
    this.contextValue = "commit reviewable";
    this.iconPath = new vscode.ThemeIcon("git-commit");
    this.command = {
      command: "codeReview.openCommitDetails",
      title: "Open Commit Details",
      arguments: [this]
    };
  }
}

export class PullRequestNode extends vscode.TreeItem {
  public constructor(
    public readonly rootPath: string,
    public readonly remote: GitHubRemote,
    public readonly pullRequest: PullRequestSummary
  ) {
    super(`#${pullRequest.number} ${pullRequest.title}`, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = pullRequest.state;
    this.tooltip = `${pullRequest.headBranch} -> ${pullRequest.baseBranch}\n${pullRequest.url}`;
    this.contextValue = "pullRequest";
    this.iconPath = new vscode.ThemeIcon(pullRequest.state === "merged" ? "git-merge" : "git-pull-request");
    this.command = {
      command: "codeReview.openPullRequest",
      title: "Open Pull Request",
      arguments: [this]
    };
  }
}

export class CheckNode extends vscode.TreeItem {
  public constructor(public readonly check: CheckSummary) {
    super(check.name, vscode.TreeItemCollapsibleState.None);
    this.description = check.conclusion ?? check.status;
    this.tooltip = check.url ?? check.name;
    this.contextValue = "check";
    this.iconPath = new vscode.ThemeIcon(iconForCheck(check));
  }
}

function iconForCheck(check: CheckSummary): string {
  if (check.conclusion === "success" || check.status === "success") {
    return "pass";
  }
  if (check.conclusion === "failure" || check.conclusion === "cancelled" || check.status === "failure") {
    return "error";
  }
  return "sync";
}

export class FileNode extends vscode.TreeItem {
  public constructor(
    public readonly rootPath: string,
    public readonly commit: CommitSummary,
    public readonly file: CommitFileChange
  ) {
    super(file.path, vscode.TreeItemCollapsibleState.None);
    this.description = `${formatFileStatus(file.status)} ${formatFileStats(file)}`;
    this.tooltip = file.previousPath ? `${file.previousPath} -> ${file.path}` : file.path;
    this.contextValue = "file";
    this.iconPath = new vscode.ThemeIcon(file.status === "deleted" ? "diff-removed" : "diff-modified");
    this.command = {
      command: "codeReview.openFileDiff",
      title: "Open File Diff",
      arguments: [this]
    };
  }
}

export class MessageNode extends vscode.TreeItem {
  public constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "message";
    this.iconPath = new vscode.ThemeIcon("info");
  }
}
