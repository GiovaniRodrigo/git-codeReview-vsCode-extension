import * as vscode from "vscode";
import { BranchService } from "../git/branchService";
import { CommitService } from "../git/commitService";
import { BranchSummary, CommitFileChange, CommitSummary, GitRef, TagSummary } from "../git/types";
import { formatCommitDate, formatFileStats, formatFileStatus } from "../utils/format";

export type CodeReviewTreeItem = RefGroupNode | BranchNode | TagNode | CommitNode | FileNode | MessageNode;

export class BranchTreeProvider implements vscode.TreeDataProvider<CodeReviewTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CodeReviewTreeItem | undefined | void>();
  public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private rootPath?: string;

  public constructor(
    private readonly branchService: BranchService,
    private readonly commitService: CommitService
  ) {}

  public setRepository(rootPath: string): void {
    this.rootPath = rootPath;
    this.refresh();
  }

  public clearRepository(): void {
    this.rootPath = undefined;
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
      return [new RefGroupNode("Branches locais", "local"), new RefGroupNode("Branches remotas", "remote"), new RefGroupNode("Tags", "tag")];
    }

    if (element instanceof RefGroupNode) {
      return this.getRefGroupChildren(element);
    }

    if (element instanceof BranchNode || element instanceof TagNode) {
      const commits = await this.commitService.listCommits(this.rootPath, element.ref.name);
      return commits.map((commit) => new CommitNode(this.rootPath!, element.ref, commit));
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
      return tags.length > 0 ? tags.map((tag) => new TagNode(tag)) : [new MessageNode("Nenhuma tag encontrada")];
    }

    const branches = group.kind === "local"
      ? await this.branchService.listLocalBranches(this.rootPath)
      : await this.branchService.listRemoteBranches(this.rootPath);

    return branches.length > 0 ? branches.map((branch) => new BranchNode(branch)) : [new MessageNode("Nenhuma branch encontrada")];
  }
}

export class RefGroupNode extends vscode.TreeItem {
  public constructor(
    label: string,
    public readonly kind: "local" | "remote" | "tag"
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = "refGroup";
    this.iconPath = new vscode.ThemeIcon(kind === "tag" ? "tag" : "git-branch");
  }
}

export class BranchNode extends vscode.TreeItem {
  public readonly ref: GitRef;

  public constructor(public readonly branch: BranchSummary) {
    super(branch.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.ref = { name: branch.name, kind: "branch", type: branch.type };
    this.description = branch.type;
    this.tooltip = branch.upstream ? `${branch.name} -> ${branch.upstream}` : branch.name;
    this.contextValue = "branch";
    this.iconPath = new vscode.ThemeIcon("git-branch");
  }
}

export class TagNode extends vscode.TreeItem {
  public readonly ref: GitRef;

  public constructor(public readonly tag: TagSummary) {
    super(tag.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.ref = { name: tag.name, kind: "tag" };
    this.description = tag.targetCommit;
    this.contextValue = "tag";
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
    this.contextValue = "commit";
    this.iconPath = new vscode.ThemeIcon("git-commit");
    this.command = {
      command: "codeReview.openCommitDetails",
      title: "Open Commit Details",
      arguments: [this]
    };
  }
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
