import * as vscode from "vscode";
import { BranchService } from "../git/branchService";
import { CommitService } from "../git/commitService";
import { RepositoryService } from "../git/repositoryService";
import { BranchSummary, CommitFileChange, CommitSummary, GitHubRemote, GitLabRemote, GitRef, GitTreeInfo, TagSummary } from "../git/types";
import { GitHubRemoteService } from "../github/githubRemote";
import { PullRequestService } from "../github/pullRequestService";
import { CheckSummary, PullRequestSummary } from "../github/types";
import { GitLabRemoteService } from "../gitlab/gitlabRemote";
import { MergeRequestService } from "../gitlab/mergeRequestService";
import { MergeRequestSummary } from "../gitlab/types";
import { ProviderRegistry } from "../remote/providerRegistry";
import { CodeReviewCheck, CodeReviewSummary, RemoteProvider } from "../remote/types";
import { formatCommitDate, formatFileStats, formatFileStatus } from "../utils/format";

export type CodeReviewTreeItem = GitTreeGroupNode | GitTreeInfoNode | RefGroupNode | BranchNode | TagNode | ReviewNode | CheckNode | CommitNode | FileNode | MessageNode;

export class BranchTreeProvider implements vscode.TreeDataProvider<CodeReviewTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CodeReviewTreeItem | undefined | void>();
  public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private rootPath?: string;
  private activeProviders: RemoteProvider[] = [];
  private reviews: CodeReviewSummary[] = [];

  public constructor(
    private readonly repositoryService: RepositoryService,
    private readonly branchService: BranchService,
    private readonly commitService: CommitService,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  public async setRepository(rootPath: string): Promise<void> {
    this.rootPath = rootPath;
    await this.refreshRemoteState();
    this.refresh();
  }

  public clearRepository(): void {
    this.rootPath = undefined;
    this.activeProviders = [];
    this.reviews = [];
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
      return [new MessageNode("No Git repository open")];
    }

    if (!element) {
      return [
        new GitTreeGroupNode(),
        new RefGroupNode("Local Branches", "local"),
        new RefGroupNode("Remote Branches", "remote"),
        new RefGroupNode("Tags", "tag"),
        new RefGroupNode("Reviews", "review")
      ];
    }

    if (element instanceof RefGroupNode) {
      return this.getRefGroupChildren(element);
    }

    if (element instanceof GitTreeGroupNode) {
      return this.getGitTreeChildren();
    }

    if (element instanceof BranchNode || element instanceof TagNode) {
      const commits = await this.commitService.listCommits(this.rootPath, element.ref.name);
      const nodes: CodeReviewTreeItem[] = [];
      let review: CodeReviewSummary | undefined;

      if (element instanceof BranchNode) {
        for (const provider of this.activeProviders) {
          review = provider.findReviewForBranch(this.reviews, element.branch.name);
          if (review) {
            nodes.push(new ReviewNode(this.rootPath, review));
            break;
          }
        }
      }
      nodes.push(...commits.map((commit) => new CommitNode(this.rootPath!, element.ref, commit, review)));
      return nodes;
    }

    if (element instanceof ReviewNode) {
      const commits = await this.commitService.listCommits(this.rootPath, element.review.headBranch);
      return [
        ...(element.review.checks?.map((check) => new CheckNode(check)) ?? []),
        ...commits.map((commit) => new CommitNode(this.rootPath!, {
          name: element.review.headBranch,
          kind: "branch",
          type: "remote"
        }, commit, element.review))
      ];
    }

    if (element instanceof CommitNode) {
      const files = await this.commitService.listChangedFiles(this.rootPath, element.commit.hash);
      return files.map((file) => new FileNode(this.rootPath!, element.commit, file, element.review));
    }

    return [];
  }

  private async getRefGroupChildren(group: RefGroupNode): Promise<CodeReviewTreeItem[]> {
    if (!this.rootPath) {
      return [];
    }

    if (group.kind === "tag") {
      const tags = await this.branchService.listTags(this.rootPath);
      return tags.length > 0 ? tags.map((tag) => new TagNode(this.rootPath!, tag)) : [new MessageNode("No tags found")];
    }

    if (group.kind === "review") {
      if (this.activeProviders.length === 0) {
        const message = this.rootPath ? "No remote providers (GitHub/GitLab) detected in remotes." : "No repository open.";
        return [new MessageNode(message)];
      }

      if (this.reviews.length === 0) {
        return [new MessageNode("No open pull/merge requests found. Try signing in or refreshing.")];
      }

      return this.reviews.map((review) => new ReviewNode(this.rootPath!, review));
    }

    const branches = group.kind === "local"
      ? await this.branchService.listLocalBranches(this.rootPath)
      : await this.branchService.listRemoteBranches(this.rootPath);

    return branches.length > 0 ? branches.map((branch) => new BranchNode(this.rootPath!, branch)) : [new MessageNode("No branches found")];
  }

  private async getGitTreeChildren(): Promise<CodeReviewTreeItem[]> {
    if (!this.rootPath) {
      return [];
    }

    try {
      const info = await this.repositoryService.getTreeInfo(this.rootPath);
      return [
        new GitTreeInfoNode("Current Branch", info.currentBranch, "git-branch", info.upstream ? `Current Branch\nUpstream: ${info.upstream}` : "Current repository branch"),
        new GitTreeInfoNode("HEAD", info.head ?? "no commit", "git-commit", "Current commit pointed by HEAD"),
        new GitTreeInfoNode("Working tree", info.isClean ? "clean" : "modified", info.isClean ? "pass" : "warning", "Summary of modified, staged, new or conflicted files"),
        ...gitTreeStatusNodes(info)
      ];
    } catch {
      return [new MessageNode("Could not read git tree info")];
    }
  }

  private async refreshRemoteState(): Promise<void> {
    this.activeProviders = [];
    this.reviews = [];

    if (!this.rootPath) {
      return;
    }

    this.activeProviders = await this.providerRegistry.detectProviders(this.rootPath);
    for (const provider of this.activeProviders) {
      try {
        const providerReviews = await provider.getReviews(this.rootPath);
        this.reviews.push(...providerReviews);
      } catch (error) {
        console.error(`Error fetching reviews from ${provider.id}:`, error);
      }
    }
  }
}

export class GitTreeGroupNode extends vscode.TreeItem {
  public constructor() {
    super("Git Tree", vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "gitTree";
    this.tooltip = "Summary of the current state of the Git repository";
    this.iconPath = new vscode.ThemeIcon("repo");
  }
}

export class GitTreeInfoNode extends vscode.TreeItem {
  public constructor(label: string, description: string, icon: string, tooltip?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.tooltip = tooltip ?? `${label}: ${description}`;
    this.contextValue = "gitTreeInfo";
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

export class RefGroupNode extends vscode.TreeItem {
  public constructor(
    label: string,
    public readonly kind: "local" | "remote" | "tag" | "review" | "pullRequest" | "mergeRequest"
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = kind === "remote" ? "remoteRefGroup" : "refGroup";
    this.tooltip = refGroupTooltip(kind);
    this.iconPath = new vscode.ThemeIcon(kind === "tag" ? "tag" : kind === "review" || kind === "pullRequest" || kind === "mergeRequest" ? "git-pull-request" : "git-branch");
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
    this.tooltip = tag.targetCommit ? `${tag.name}\nTarget: ${tag.targetCommit}` : tag.name;
    this.contextValue = "tag reviewable";
    this.iconPath = new vscode.ThemeIcon("tag");
  }
}

export class ReviewNode extends vscode.TreeItem {
  public constructor(
    public readonly rootPath: string,
    public readonly review: CodeReviewSummary
  ) {
    super(`${review.providerId === "gitlab" ? "!" : "#"}${review.number} ${review.title}`, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = review.state;
    this.tooltip = `${review.headBranch} -> ${review.baseBranch}\n${review.url}`;
    this.contextValue = "review";
    this.iconPath = new vscode.ThemeIcon(review.state === "merged" ? "git-merge" : "git-pull-request");
    this.command = {
      command: "codeReview.openReviewExternal",
      title: "Open Review",
      arguments: [this]
    };
  }
}

export class CommitNode extends vscode.TreeItem {
  public constructor(
    public readonly rootPath: string,
    public readonly ref: GitRef,
    public readonly commit: CommitSummary,
    public readonly review?: CodeReviewSummary
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

export class CheckNode extends vscode.TreeItem {
  public constructor(public readonly check: CodeReviewCheck | CheckSummary) {
    super(check.name, vscode.TreeItemCollapsibleState.None);
    this.description = check.conclusion ?? check.status;
    this.tooltip = `${check.name}\nStatus: ${check.status}${check.conclusion ? `\nConclusion: ${check.conclusion}` : ""}${check.url ? `\n${check.url}` : ""}`;
    this.contextValue = "check";
    this.iconPath = new vscode.ThemeIcon(iconForCheck(check));
  }
}

function iconForCheck(check: CodeReviewCheck | CheckSummary): string {
  if (check.conclusion === "success" || check.status === "success") {
    return "pass";
  }
  if (check.conclusion === "failure" || check.conclusion === "cancelled" || check.status === "failure") {
    return "error";
  }
  return "sync";
}

function gitTreeStatusNodes(info: GitTreeInfo): GitTreeInfoNode[] {
  const nodes: GitTreeInfoNode[] = [];
  if (info.upstream) {
    nodes.push(new GitTreeInfoNode("Upstream", info.upstream, "cloud", "Remote branch followed by current branch"));
  }
  if (info.ahead > 0 || info.behind > 0) {
    nodes.push(new GitTreeInfoNode("Sync", `ahead ${info.ahead} / behind ${info.behind}`, "sync", "Difference between local branch and upstream"));
  }
  if (info.staged > 0) {
    nodes.push(new GitTreeInfoNode("Staged", String(info.staged), "diff-added", "Files staged for commit"));
  }
  if (info.unstaged > 0) {
    nodes.push(new GitTreeInfoNode("Unstaged", String(info.unstaged), "diff-modified", "Modified files not yet staged"));
  }
  if (info.untracked > 0) {
    nodes.push(new GitTreeInfoNode("Untracked", String(info.untracked), "new-file", "New files not yet tracked by Git"));
  }
  if (info.conflicts > 0) {
    nodes.push(new GitTreeInfoNode("Conflicts", String(info.conflicts), "warning", "Files with merge conflicts"));
  }
  return nodes;
}

export class FileNode extends vscode.TreeItem {
  public constructor(
    public readonly rootPath: string,
    public readonly commit: CommitSummary,
    public readonly file: CommitFileChange,
    public readonly review?: CodeReviewSummary
  ) {
    super(file.path, vscode.TreeItemCollapsibleState.None);
    this.description = `${formatFileStatus(file.status)} ${formatFileStats(file)}`;
    this.tooltip = `${file.previousPath ? `${file.previousPath} -> ${file.path}` : file.path}\nStatus: ${file.status}\n${formatFileStats(file)}`;
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
    this.tooltip = label;
    this.iconPath = new vscode.ThemeIcon("info");
  }
}

function refGroupTooltip(kind: RefGroupNode["kind"]): string {
  switch (kind) {
    case "local":
      return "Local branches available in this repository";
    case "remote":
      return "Remote branches fetched from Git remotes";
    case "tag":
      return "Git tags available in this repository";
    case "review":
      return "Pull/Merge requests found on remote providers";
    case "pullRequest":
      return "Pull requests found on GitHub for this remote";
    case "mergeRequest":
      return "Merge requests found on GitLab for this remote";
  }
}

