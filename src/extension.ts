import * as vscode from "vscode";
import { BranchService } from "./git/branchService";
import { CommitService } from "./git/commitService";
import { GitService } from "./git/gitService";
import { GitHubClientFactory } from "./github/githubClient";
import { GitHubRemoteService } from "./github/githubRemote";
import { PullRequestService } from "./github/pullRequestService";
import { ProductivityService } from "./productivity/productivityService";
import { ReviewState } from "./productivity/reviewState";
import { createGitDocumentUri, GitContentProvider, gitReviewScheme } from "./review/gitContentProvider";
import { DiffRenderer } from "./review/diffRenderer";
import { ReviewPanel } from "./review/reviewPanel";
import { BranchNode, BranchTreeProvider, CommitNode, FileNode, PullRequestNode, TagNode } from "./tree/BranchTreeProvider";
import { showError } from "./utils/error";
import { formatCommitDate, formatFileStats, formatFileStatus } from "./utils/format";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const git = new GitService();
  const branchService = new BranchService(git);
  const commitService = new CommitService(git);
  const githubClientFactory = new GitHubClientFactory();
  const githubRemoteService = new GitHubRemoteService(git);
  const pullRequestService = new PullRequestService(githubClientFactory);
  const reviewState = new ReviewState(context);
  const productivityService = new ProductivityService(git, branchService, commitService, reviewState);
  const diffRenderer = new DiffRenderer(git);
  const treeProvider = new BranchTreeProvider(branchService, commitService, githubRemoteService, pullRequestService);
  let lastHead: string | undefined;

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(gitReviewScheme, new GitContentProvider(git)),
    vscode.window.createTreeView("codeReviewExplorer", { treeDataProvider: treeProvider }),
    vscode.commands.registerCommand("codeReview.refresh", async () => {
      commitService.clearCache();
      await initializeRepository(git, treeProvider);
    }),
    vscode.commands.registerCommand("codeReview.openReview", async (node?: BranchNode | TagNode | CommitNode) => {
      if (!node) {
        return;
      }

      await openReview(context, commitService, node);
    }),
    vscode.commands.registerCommand("codeReview.signInGitHub", async () => {
      try {
        await githubClientFactory.create(true);
        vscode.window.showInformationMessage("GitHub autenticado.");
        await initializeRepository(git, treeProvider);
      } catch (error) {
        await showError(error);
      }
    }),
    vscode.commands.registerCommand("codeReview.openPullRequest", async (node?: PullRequestNode) => {
      if (!node) {
        return;
      }
      await vscode.env.openExternal(vscode.Uri.parse(node.pullRequest.url));
    }),
    vscode.commands.registerCommand("codeReview.approvePullRequest", async (node?: PullRequestNode) => {
      if (!node) {
        return;
      }
      await submitPullRequestReview(pullRequestService, node, "APPROVE");
    }),
    vscode.commands.registerCommand("codeReview.requestChanges", async (node?: PullRequestNode) => {
      if (!node) {
        return;
      }
      await submitPullRequestReview(pullRequestService, node, "REQUEST_CHANGES");
    }),
    vscode.commands.registerCommand("codeReview.commentPullRequest", async (node?: PullRequestNode) => {
      if (!node) {
        return;
      }
      await submitPullRequestReview(pullRequestService, node, "COMMENT");
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
    vscode.commands.registerCommand("codeReview.openGithubStyleDiff", async (node?: FileNode) => {
      if (!node) {
        return;
      }

      await diffRenderer.openPatch(node.rootPath, node.commit.hash, node.file.path);
    }),
    vscode.commands.registerCommand("codeReview.addReviewComment", async (node?: FileNode) => {
      if (!node) {
        return;
      }

      await addReviewComment(githubRemoteService, pullRequestService, node);
    }),
    vscode.commands.registerCommand("codeReview.compareBranches", async () => {
      await runForRepository(git, (rootPath) => productivityService.compareBranches(rootPath));
    }),
    vscode.commands.registerCommand("codeReview.markReviewed", async (node?: CommitNode) => {
      if (!node) {
        return;
      }

      await reviewState.markReviewed(node.rootPath, node.commit.hash);
      vscode.window.showInformationMessage(`Commit ${node.commit.shortHash} marcado como revisado.`);
    }),
    vscode.commands.registerCommand("codeReview.showUnreviewed", async () => {
      await runForRepository(git, (rootPath) => productivityService.showUnreviewed(rootPath));
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      await initializeRepository(git, treeProvider);
    }),
    vscode.workspace.onDidSaveTextDocument(async () => {
      commitService.clearCache();
    })
  );

  const refreshTimer = setInterval(async () => {
      try {
        lastHead = await notifyOnHeadChange(git, lastHead);
        await initializeRepository(git, treeProvider, false);
      } catch {
        // Background refresh must never interrupt the user.
      }
    }, 120_000);
  context.subscriptions.push(
    new vscode.Disposable(() => clearInterval(refreshTimer))
  );

  await initializeRepository(git, treeProvider);
  lastHead = await readHead(git);
}

async function openReview(context: vscode.ExtensionContext, commitService: CommitService, node: BranchNode | TagNode | CommitNode): Promise<void> {
  try {
    if (node instanceof CommitNode) {
      await ReviewPanel.openForCommit(context, commitService, node.rootPath, node.ref, node.commit);
      return;
    }

    await ReviewPanel.openForRef(context, commitService, node.rootPath, node.ref);
  } catch (error) {
    await showError(error);
  }
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions automatically.
}

async function initializeRepository(git: GitService, treeProvider: BranchTreeProvider, showErrors = true): Promise<void> {
  try {
    const rootPath = await git.getRepositoryRoot();
    await treeProvider.setRepository(rootPath);
  } catch (error) {
    treeProvider.clearRepository();
    if (showErrors) {
      await showError(error);
    }
  }
}

async function runForRepository(git: GitService, callback: (rootPath: string) => Promise<void>): Promise<void> {
  try {
    await callback(await git.getRepositoryRoot());
  } catch (error) {
    await showError(error);
  }
}

async function notifyOnHeadChange(git: GitService, previousHead: string | undefined): Promise<string | undefined> {
  const currentHead = await readHead(git);
  if (previousHead && currentHead && previousHead !== currentHead) {
    vscode.window.showInformationMessage("Novos commits detectados no repositorio ativo.");
  }
  return currentHead ?? previousHead;
}

async function readHead(git: GitService): Promise<string | undefined> {
  try {
    const rootPath = await git.getRepositoryRoot();
    return await git.run(["rev-parse", "HEAD"], rootPath);
  } catch {
    return undefined;
  }
}

async function submitPullRequestReview(
  pullRequestService: PullRequestService,
  node: PullRequestNode,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"
): Promise<void> {
  const body = await vscode.window.showInputBox({
    title: reviewTitle(event, node.pullRequest.number),
    prompt: "Texto do review geral",
    ignoreFocusOut: true
  });
  if (body === undefined) {
    return;
  }

  try {
    await pullRequestService.submitReview(node.remote, node.pullRequest.number, event, body);
    vscode.window.showInformationMessage(`Review enviado para PR #${node.pullRequest.number}.`);
  } catch (error) {
    await showError(error);
  }
}

function reviewTitle(event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT", pullNumber: number): string {
  if (event === "APPROVE") {
    return `Aprovar PR #${pullNumber}`;
  }
  if (event === "REQUEST_CHANGES") {
    return `Solicitar mudancas no PR #${pullNumber}`;
  }
  return `Comentar PR #${pullNumber}`;
}

async function addReviewComment(
  githubRemoteService: GitHubRemoteService,
  pullRequestService: PullRequestService,
  node: FileNode
): Promise<void> {
  try {
    const remote = await githubRemoteService.detect(node.rootPath);
    if (!remote) {
      throw new Error("Nenhum remote GitHub detectado para enviar comentario.");
    }

    const pullNumberText = await vscode.window.showInputBox({
      title: "Numero do pull request",
      prompt: "Informe o numero do PR que recebera o comentario",
      validateInput: (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? undefined : "Informe um numero de PR valido"
    });
    if (!pullNumberText) {
      return;
    }

    const lineText = await vscode.window.showInputBox({
      title: "Linha do comentario",
      prompt: "Informe a linha no arquivo alterado. Deixe em branco para comentario geral no PR."
    });
    const body = await vscode.window.showInputBox({
      title: `Comentario em ${node.file.path}`,
      prompt: "Texto do comentario",
      ignoreFocusOut: true
    });
    if (!body) {
      return;
    }

    const confirmed = await vscode.window.showWarningMessage("Enviar comentario ao GitHub?", { modal: true }, "Enviar");
    if (confirmed !== "Enviar") {
      return;
    }

    await pullRequestService.createReviewComment(remote, Number(pullNumberText), node.commit.hash, {
      body,
      path: node.file.path,
      line: lineText ? Number(lineText) : undefined
    });
    vscode.window.showInformationMessage("Comentario enviado ao GitHub.");
  } catch (error) {
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
