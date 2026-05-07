import * as vscode from "vscode";
import { BranchService } from "./git/branchService";
import { CommitService } from "./git/commitService";
import { GitService } from "./git/gitService";
import { createGitDocumentUri, GitContentProvider, gitReviewScheme } from "./review/gitContentProvider";
import { BranchTreeProvider, CommitNode, FileNode } from "./tree/BranchTreeProvider";
import { showError } from "./utils/error";
import { formatCommitDate, formatFileStats, formatFileStatus } from "./utils/format";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const git = new GitService();
  const branchService = new BranchService(git);
  const commitService = new CommitService(git);
  const treeProvider = new BranchTreeProvider(branchService, commitService);

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(gitReviewScheme, new GitContentProvider(git)),
    vscode.window.createTreeView("codeReviewExplorer", { treeDataProvider: treeProvider }),
    vscode.commands.registerCommand("codeReview.refresh", async () => {
      await initializeRepository(git, treeProvider);
    }),
    vscode.commands.registerCommand("codeReview.openCommitDetails", async (node?: CommitNode) => {
      if (!node) {
        return;
      }

      await openCommitDetails(commitService, node);
    }),
    vscode.commands.registerCommand("codeReview.openFileDiff", async (node?: FileNode) => {
      if (!node) {
        return;
      }

      await openFileDiff(node);
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      await initializeRepository(git, treeProvider);
    })
  );

  await initializeRepository(git, treeProvider);
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions automatically.
}

async function initializeRepository(git: GitService, treeProvider: BranchTreeProvider): Promise<void> {
  try {
    const rootPath = await git.getRepositoryRoot();
    treeProvider.setRepository(rootPath);
  } catch (error) {
    treeProvider.clearRepository();
    await showError(error);
  }
}

async function openCommitDetails(commitService: CommitService, node: CommitNode): Promise<void> {
  try {
    const details = await commitService.getCommitDetails(node.rootPath, node.commit.hash);
    const document = await vscode.workspace.openTextDocument({
      language: "markdown",
      content: [
        `# ${details.shortHash} ${details.message}`,
        "",
        `- Hash: \`${details.hash}\``,
        `- Author: ${details.authorName}${details.authorEmail ? ` <${details.authorEmail}>` : ""}`,
        `- Date: ${formatCommitDate(details.date)}`,
        "",
        "## Files",
        "",
        ...details.files.map((file) => `- ${formatFileStatus(file.status)} ${file.path} (${formatFileStats(file)})`),
        details.body ? "\n## Body\n" : "",
        details.body ?? ""
      ].join("\n")
    });

    await vscode.window.showTextDocument(document, { preview: true });
  } catch (error) {
    await showError(error);
  }
}

async function openFileDiff(node: FileNode): Promise<void> {
  const leftPath = node.file.previousPath ?? node.file.path;
  const left = createGitDocumentUri(node.rootPath, `${node.commit.hash}^`, leftPath);
  const right = createGitDocumentUri(node.rootPath, node.commit.hash, node.file.path);
  const title = `${node.commit.shortHash}: ${node.file.path}`;

  await vscode.commands.executeCommand("vscode.diff", left, right, title);
}
