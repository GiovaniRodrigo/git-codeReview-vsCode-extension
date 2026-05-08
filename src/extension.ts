import * as vscode from "vscode";
import { BranchService } from "./git/branchService";
import { CommitService } from "./git/commitService";
import { GitService } from "./git/gitService";
import { RepositoryService } from "./git/repositoryService";
import { GitHubClientFactory } from "./github/githubClient";
import { GitHubRemoteService } from "./github/githubRemote";
import { PullRequestService } from "./github/pullRequestService";
import { GitLabClientFactory } from "./gitlab/gitlabClient";
import { GitLabRemoteService } from "./gitlab/gitlabRemote";
import { MergeRequestService } from "./gitlab/mergeRequestService";
import { ProductivityService } from "./productivity/productivityService";
import { ReviewProcess, ReviewProcessStore, reviewProcessDescription } from "./productivity/reviewProcess";
import { ReviewState } from "./productivity/reviewState";
import { GitHubProvider } from "./remote/githubProvider";
import { GitLabProvider } from "./remote/gitlabProvider";
import { ProviderRegistry } from "./remote/providerRegistry";
import { CodeReviewSummary, RemoteProvider } from "./remote/types";
import { createGitDocumentUri, GitContentProvider, gitReviewScheme } from "./review/gitContentProvider";
import { DiffRenderer } from "./review/diffRenderer";
import { ReviewPanel } from "./review/reviewPanel";
import { TelemetryService } from "./telemetry/telemetryService";
import { BranchNode, BranchTreeProvider, CommitNode, FileNode, ReviewNode, TagNode } from "./tree/BranchTreeProvider";
import { ConfigService } from "./utils/config";
import { showError } from "./utils/error";
import { formatCommitDate, formatFileStats, formatFileStatus } from "./utils/format";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const git = new GitService();
  const branchService = new BranchService(git);
  const commitService = new CommitService(git);
  const repositoryService = new RepositoryService(git);
  const githubClientFactory = new GitHubClientFactory();
  const githubRemoteService = new GitHubRemoteService(git);
  const pullRequestService = new PullRequestService(githubClientFactory);
  const gitlabClientFactory = new GitLabClientFactory(context.secrets);
  const gitlabRemoteService = new GitLabRemoteService(git);
  const mergeRequestService = new MergeRequestService(gitlabClientFactory);

  const providerRegistry = new ProviderRegistry();
  providerRegistry.register(new GitHubProvider(git, pullRequestService));
  providerRegistry.register(new GitLabProvider(git, mergeRequestService));

  const reviewState = new ReviewState(context);
  const reviewProcessStore = new ReviewProcessStore(context);
  const telemetry = new TelemetryService(context);
  const productivityService = new ProductivityService(git, branchService, commitService, reviewState);
  const diffRenderer = new DiffRenderer(git);
  const treeProvider = new BranchTreeProvider(repositoryService, branchService, commitService, providerRegistry);
  let lastHead: string | undefined;

  context.subscriptions.push(
    telemetry,
    vscode.workspace.registerTextDocumentContentProvider(gitReviewScheme, new GitContentProvider(git)),
    vscode.window.createTreeView("codeReviewExplorer", { treeDataProvider: treeProvider }),
    vscode.commands.registerCommand("codeReview.refresh", async () => {
      telemetry.track("command.refresh");
      commitService.clearCache();
      await initializeRepository(git, treeProvider);
    }),
    vscode.commands.registerCommand("codeReview.fetchRemoteBranches", async () => {
      telemetry.track("command.fetchRemoteBranches");
      await fetchRemoteBranches(git, branchService, commitService, treeProvider);
    }),
    vscode.commands.registerCommand("codeReview.openReview", async (node?: BranchNode | TagNode | CommitNode) => {
      if (!node) {
        return;
      }

      telemetry.track("command.openReview", { target: node instanceof CommitNode ? "commit" : node instanceof TagNode ? "tag" : "branch" });
      await openReview(context, commitService, reviewState, node);
    }),
    vscode.commands.registerCommand("codeReview.createReviewProcess", async (node?: BranchNode | TagNode | CommitNode) => {
      telemetry.track("command.createReviewProcess");
      await createReviewProcess(context, git, branchService, reviewProcessStore, commitService, reviewState, node);
    }),
    vscode.commands.registerCommand("codeReview.resumeReviewProcess", async () => {
      telemetry.track("command.resumeReviewProcess");
      await resumeReviewProcess(context, git, reviewProcessStore, commitService, reviewState);
    }),
    vscode.commands.registerCommand("codeReview.completeReviewProcess", async () => {
      telemetry.track("command.completeReviewProcess");
      await completeReviewProcess(git, reviewProcessStore);
    }),
    vscode.commands.registerCommand("codeReview.signInGitHub", async () => {
      telemetry.track("command.signInGitHub");
      try {
        await githubClientFactory.create(true);
        vscode.window.showInformationMessage("GitHub authenticated.");
        await initializeRepository(git, treeProvider);
      } catch (error) {
        await showError(error);
      }
    }),
    vscode.commands.registerCommand("codeReview.linkGitLab", async () => {
      telemetry.track("command.linkGitLab");
      await linkGitLab(gitlabClientFactory, git, treeProvider);
    }),
    vscode.commands.registerCommand("codeReview.openPullRequest", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.openPullRequest");
      await vscode.env.openExternal(vscode.Uri.parse(node.review.url));
    }),
    vscode.commands.registerCommand("codeReview.openMergeRequest", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.openMergeRequest");
      await vscode.env.openExternal(vscode.Uri.parse(node.review.url));
    }),
    vscode.commands.registerCommand("codeReview.openReviewExternal", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.openReviewExternal");
      await vscode.env.openExternal(vscode.Uri.parse(node.review.url));
    }),
    vscode.commands.registerCommand("codeReview.approveReview", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.approveReview");
      await submitReview(providerRegistry, node, "APPROVE");
    }),
    vscode.commands.registerCommand("codeReview.rejectReview", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.rejectReview");
      await submitReview(providerRegistry, node, "REQUEST_CHANGES");
    }),
    vscode.commands.registerCommand("codeReview.commentReview", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.commentReview");
      await submitReview(providerRegistry, node, "COMMENT");
    }),
    vscode.commands.registerCommand("codeReview.approvePullRequest", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.approvePullRequest");
      await submitReview(providerRegistry, node, "APPROVE");
    }),
    vscode.commands.registerCommand("codeReview.requestChanges", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.requestChanges");
      await submitReview(providerRegistry, node, "REQUEST_CHANGES");
    }),
    vscode.commands.registerCommand("codeReview.commentPullRequest", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.commentPullRequest");
      await submitReview(providerRegistry, node, "COMMENT");
    }),
    vscode.commands.registerCommand("codeReview.approveMergeRequest", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.approveMergeRequest");
      await submitReview(providerRegistry, node, "APPROVE");
    }),
    vscode.commands.registerCommand("codeReview.rejectMergeRequest", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.rejectMergeRequest");
      await submitReview(providerRegistry, node, "REQUEST_CHANGES");
    }),
    vscode.commands.registerCommand("codeReview.commentMergeRequest", async (node?: ReviewNode) => {
      if (!node) {
        return;
      }
      telemetry.track("command.commentMergeRequest");
      await submitReview(providerRegistry, node, "COMMENT");
    }),
    vscode.commands.registerCommand("codeReview.openCommitDetails", async (node?: CommitNode) => {
      if (!node) {
        return;
      }

      telemetry.track("command.openCommitDetails");
      await openCommitDetails(commitService, node);
    }),
    vscode.commands.registerCommand("codeReview.openFileDiff", async (node?: FileNode) => {
      if (!node) {
        return;
      }

      telemetry.track("command.openFileDiff");
      await openFileDiff(node);
    }),
    vscode.commands.registerCommand("codeReview.openGithubStyleDiff", async (node?: FileNode) => {
      if (!node) {
        return;
      }

      telemetry.track("command.openGithubStyleDiff");
      await diffRenderer.openPatch(node.rootPath, node.commit.hash, node.file.path);
    }),
    vscode.commands.registerCommand("codeReview.addReviewComment", async (node?: FileNode) => {
      if (!node) {
        return;
      }

      telemetry.track("command.addReviewComment");
      await addReviewComment(providerRegistry, node);
    }),
    vscode.commands.registerCommand("codeReview.compareBranches", async () => {
      telemetry.track("command.compareBranches");
      await runForRepository(git, (rootPath) => productivityService.compareBranches(rootPath));
    }),
    vscode.commands.registerCommand("codeReview.markReviewed", async (node?: CommitNode) => {
      if (!node) {
        return;
      }

      telemetry.track("command.markReviewed");
      await reviewState.markReviewed(node.rootPath, node.commit.hash);
      vscode.window.showInformationMessage(`Commit ${node.commit.shortHash} marked as reviewed.`);
    }),
    vscode.commands.registerCommand("codeReview.showUnreviewed", async () => {
      telemetry.track("command.showUnreviewed");
      await runForRepository(git, (rootPath) => productivityService.showUnreviewed(rootPath));
    }),
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration("codeReview")) {
        await initializeRepository(git, treeProvider, false);
      }
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

async function createReviewProcess(
  context: vscode.ExtensionContext,
  git: GitService,
  branchService: BranchService,
  reviewProcessStore: ReviewProcessStore,
  commitService: CommitService,
  reviewState: ReviewState,
  node?: BranchNode | TagNode | CommitNode
): Promise<void> {
  try {
    const target = node ?? await pickReviewProcessTarget(git, branchService);
    if (!target) {
      return;
    }

    const defaultName = target instanceof CommitNode ? `Review ${target.ref.name} @ ${target.commit.shortHash}` : `Review ${target.ref.name}`;
    const name = await vscode.window.showInputBox({
      title: "Create code review process",
      prompt: "Name to resume this review later",
      value: defaultName,
      ignoreFocusOut: true
    });
    if (name === undefined) {
      return;
    }

    const process = await reviewProcessStore.create({
      rootPath: target.rootPath,
      name,
      ref: target.ref,
      commit: target instanceof CommitNode ? target.commit : undefined
    });
    await openReviewProcess(context, reviewProcessStore, commitService, reviewState, process);
    vscode.window.showInformationMessage(`Review process saved: ${process.name}`);
  } catch (error) {
    await showError(error);
  }
}

async function pickReviewProcessTarget(git: GitService, branchService: BranchService): Promise<BranchNode | TagNode | undefined> {
  const rootPath = await git.getRepositoryRoot();
  const [localBranches, remoteBranches, tags] = await Promise.all([
    branchService.listLocalBranches(rootPath),
    branchService.listRemoteBranches(rootPath),
    branchService.listTags(rootPath)
  ]);
  const items = [
    ...localBranches.map((branch) => ({
      label: branch.name,
      description: "local branch",
      node: new BranchNode(rootPath, branch)
    })),
    ...remoteBranches.map((branch) => ({
      label: branch.name,
      description: "remote branch",
      node: new BranchNode(rootPath, branch)
    })),
    ...tags.map((tag) => ({
      label: tag.name,
      description: "tag",
      node: new TagNode(rootPath, tag)
    }))
  ].sort((left, right) => left.label.localeCompare(right.label));

  const selected = await vscode.window.showQuickPick(items, {
    title: "Create code review process",
    placeHolder: "Choose a branch or tag to review"
  });

  return selected?.node;
}

async function resumeReviewProcess(
  context: vscode.ExtensionContext,
  git: GitService,
  reviewProcessStore: ReviewProcessStore,
  commitService: CommitService,
  reviewState: ReviewState
): Promise<void> {
  try {
    const rootPath = await git.getRepositoryRoot();
    const processes = reviewProcessStore.list(rootPath).filter((process) => process.status === "active");
    if (processes.length === 0) {
      vscode.window.showInformationMessage("No active review process found for this repository.");
      return;
    }

    const selected = await vscode.window.showQuickPick(processes.map((process) => ({
      label: process.name,
      description: reviewProcessDescription(process),
      detail: `Updated on ${new Date(process.updatedAt).toLocaleString()}`,
      process
    })), {
      title: "Resume code review process",
      placeHolder: "Choose a saved review"
    });
    if (!selected) {
      return;
    }

    await openReviewProcess(context, reviewProcessStore, commitService, reviewState, selected.process);
  } catch (error) {
    await showError(error);
  }
}

async function completeReviewProcess(git: GitService, reviewProcessStore: ReviewProcessStore): Promise<void> {
  try {
    const rootPath = await git.getRepositoryRoot();
    const processes = reviewProcessStore.list(rootPath).filter((process) => process.status === "active");
    if (processes.length === 0) {
      vscode.window.showInformationMessage("No active review process to complete.");
      return;
    }

    const selected = await vscode.window.showQuickPick(processes.map((process) => ({
      label: process.name,
      description: reviewProcessDescription(process),
      process
    })), {
      title: "Complete code review process"
    });
    if (!selected) {
      return;
    }

    await reviewProcessStore.complete(selected.process.id);
    vscode.window.showInformationMessage(`Review process completed: ${selected.process.name}`);
  } catch (error) {
    await showError(error);
  }
}

async function openReviewProcess(
  context: vscode.ExtensionContext,
  reviewProcessStore: ReviewProcessStore,
  commitService: CommitService,
  reviewState: ReviewState,
  process: ReviewProcess
): Promise<void> {
  await reviewProcessStore.touch(process.id);
  if (process.targetKind === "commit" && process.commitHash) {
    const details = await commitService.getCommitDetails(process.rootPath, process.commitHash);
    await ReviewPanel.openForCommit(context, commitService, reviewState, process.rootPath, process.ref, details);
    return;
  }

  await ReviewPanel.openForRef(context, commitService, reviewState, process.rootPath, process.ref);
}

async function openReview(context: vscode.ExtensionContext, commitService: CommitService, reviewState: ReviewState, node: BranchNode | TagNode | CommitNode): Promise<void> {
  try {
    if (node instanceof CommitNode) {
      await ReviewPanel.openForCommit(context, commitService, reviewState, node.rootPath, node.ref, node.commit);
      return;
    }

    await ReviewPanel.openForRef(context, commitService, reviewState, node.rootPath, node.ref);
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

async function fetchRemoteBranches(
  git: GitService,
  branchService: BranchService,
  commitService: CommitService,
  treeProvider: BranchTreeProvider
): Promise<void> {
  try {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Fetching remote branches...",
      cancellable: false
    }, async () => {
      const rootPath = await git.getRepositoryRoot();
      await branchService.fetchRemoteBranches(rootPath);
      commitService.clearCache();
      await treeProvider.setRepository(rootPath);
    });
    vscode.window.showInformationMessage("Remote branches updated.");
  } catch (error) {
    await showError(error);
  }
}

async function linkGitLab(gitlabClientFactory: GitLabClientFactory, git: GitService, treeProvider: BranchTreeProvider): Promise<void> {
  const token = await vscode.window.showInputBox({
    title: "Link GitLab: Access Token",
    prompt: "Enter a GitLab Personal Access Token with read access to Merge Requests",
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => value.trim().length > 0 ? undefined : "Enter a valid GitLab token"
  });
  if (!token) {
    return;
  }

  const domain = await vscode.window.showInputBox({
    title: "Link GitLab: Domain",
    prompt: "Enter your GitLab domain (e.g. git.acto.com.br). Leave blank for gitlab.com",
    placeHolder: "gitlab.com",
    ignoreFocusOut: true
  });

  try {
    await gitlabClientFactory.setToken(token.trim());

    if (domain && domain.trim().toLowerCase() !== "gitlab.com") {
      await ConfigService.addGitLabCustomDomain(domain);
    }

    await initializeRepository(git, treeProvider);
    vscode.window.showInformationMessage("GitLab linked and domain configured.");
  } catch (error) {
    await showError(error);
  }
}

async function notifyOnHeadChange(git: GitService, previousHead: string | undefined): Promise<string | undefined> {
  const currentHead = await readHead(git);
  if (previousHead && currentHead && previousHead !== currentHead) {
    vscode.window.showInformationMessage("New commits detected in the active repository.");
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

async function submitReview(
  providerRegistry: ProviderRegistry,
  node: ReviewNode,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"
): Promise<void> {
  const provider = providerRegistry.getProviders().find(p => p.id === node.review.providerId);
  if (!provider) {
    await vscode.window.showErrorMessage(`No provider found for ${node.review.providerId}`);
    return;
  }

  const body = await vscode.window.showInputBox({
    title: reviewTitle(event, node.review),
    prompt: "General review text",
    ignoreFocusOut: true
  });
  if (body === undefined) {
    return;
  }

  try {
    if (event === "APPROVE") {
      await provider.approve(node.review);
    } else if (event === "REQUEST_CHANGES") {
      await provider.reject(node.review, body);
    } else {
      await provider.comment(node.review, { body });
    }
    vscode.window.showInformationMessage(`Review submitted for ${node.label}.`);
  } catch (error) {
    await showError(error);
  }
}

function reviewTitle(event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT", review: CodeReviewSummary): string {
  const prefix = review.providerId === "gitlab" ? "MR !" : "PR #";
  if (event === "APPROVE") {
    return `Approve ${prefix}${review.number}`;
  }
  if (event === "REQUEST_CHANGES") {
    return `Request Changes on ${prefix}${review.number}`;
  }
  return `Comment on ${prefix}${review.number}`;
}

async function addReviewComment(
  providerRegistry: ProviderRegistry,
  node: FileNode
): Promise<void> {
  try {
    let review = node.review;
    let provider: RemoteProvider | undefined;

    if (review) {
      provider = providerRegistry.getProviders().find(p => p.id === review!.providerId);
    } else {
      const activeProviders = await providerRegistry.detectProviders(node.rootPath);
      if (activeProviders.length === 1) {
        provider = activeProviders[0];
      } else if (activeProviders.length > 1) {
        const selected = await vscode.window.showQuickPick(activeProviders.map(p => p.id), { placeHolder: "Select remote provider" });
        provider = activeProviders.find(p => p.id === selected);
      }
    }

    if (!provider) {
      throw new Error("No remote provider detected to send comment.");
    }

    if (!review) {
      const reviews = await provider.getReviews(node.rootPath);
      const reviewNumberText = await vscode.window.showInputBox({
        title: "Review Number",
        prompt: `Enter the ${provider.id === "gitlab" ? "MR" : "PR"} number to receive the comment`,
        validateInput: (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? undefined : "Enter a valid number"
      });
      if (!reviewNumberText) {
        return;
      }
      const number = Number(reviewNumberText);
      review = reviews.find((r: CodeReviewSummary) => r.number === number) || {
        id: reviewNumberText,
        number,
        title: "",
        state: "open",
        headBranch: "",
        baseBranch: "",
        headSha: node.commit.hash,
        url: "",
        providerId: provider.id
      };
    }

    const lineText = await vscode.window.showInputBox({
      title: "Comment Line",
      prompt: "Enter the line number in the changed file. Leave blank for a general comment."
    });
    const body = await vscode.window.showInputBox({
      title: `Comment on ${node.file.path}`,
      prompt: "Comment text",
      ignoreFocusOut: true
    });
    if (!body) {
      return;
    }

    const confirmed = await vscode.window.showWarningMessage(`Send comment to ${provider.id}?`, { modal: true }, "Send");
    if (confirmed !== "Send") {
      return;
    }

    await provider.comment(review, {
      body,
      path: node.file.path,
      line: lineText ? Number(lineText) : undefined
    });
    vscode.window.showInformationMessage(`Comment sent to ${provider.id}.`);
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
