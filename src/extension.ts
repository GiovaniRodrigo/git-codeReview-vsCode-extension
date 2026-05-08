import * as vscode from 'vscode';
import { ReviewSessionService } from './application/reviewSessionService';
import { GitCliService } from './infrastructure/gitCliService';
import { VscodeReviewSessionRepository } from './infrastructure/vscodeReviewSessionRepository';
import { ReviewPanel } from './presentation/reviewPanel';
import { ReviewSidebarProvider } from './presentation/reviewSidebarProvider';

export function activate(context: vscode.ExtensionContext): void {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const repository = new VscodeReviewSessionRepository(context);
  const gitService = new GitCliService(workspaceFolder);
  const reviewSessionService = new ReviewSessionService(repository, gitService);
  const reviewPanel = new ReviewPanel(context, reviewSessionService);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ReviewSidebarProvider.viewType, new ReviewSidebarProvider(reviewSessionService)),
    vscode.commands.registerCommand('codeReview.openDashboard', () => reviewPanel.open('dashboard')),
    vscode.commands.registerCommand('codeReview.startReview', () => reviewPanel.startReview()),
    vscode.commands.registerCommand('codeReview.openPullRequest', () => reviewPanel.open('dashboard'))
  );

  reviewPanel.open('dashboard');
}

export function deactivate(): void {}
