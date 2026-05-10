import * as vscode from 'vscode';
import { ReviewSessionService } from './application/reviewSessionService';
import { GitCliService } from './infrastructure/gitCliService';
import { LocalJsonReviewSessionRepository } from './infrastructure/localJsonReviewSessionRepository';
import { WorkspaceSourceFileProvider } from './infrastructure/workspaceSourceFileProvider';
import { ReviewPanel } from './presentation/reviewPanel';
import { ReviewSidebarProvider } from './presentation/reviewSidebarProvider';
import { FileAuditService } from './infrastructure/audit/fileAuditService';

export function activate(context: vscode.ExtensionContext): void {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const repository = new LocalJsonReviewSessionRepository(context);
  const gitService = new GitCliService(workspaceFolder);
  const sourceFileProvider = new WorkspaceSourceFileProvider(workspaceFolder);
  const auditService = new FileAuditService(context);
  const reviewSessionService = new ReviewSessionService(repository, gitService, sourceFileProvider, auditService);
  const reviewPanel = new ReviewPanel(context, reviewSessionService);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ReviewSidebarProvider.viewType, new ReviewSidebarProvider(reviewSessionService)),
    vscode.commands.registerCommand('codeReview.openDashboard', () => reviewPanel.open('dashboard')),
    vscode.commands.registerCommand('codeReview.startReview', () => reviewPanel.startReview()),
    vscode.commands.registerCommand('codeReview.openPullRequest', () => reviewPanel.open('dashboard')),
    vscode.commands.registerCommand('codeReview.exportAuditLog', async () => {
      const data = await reviewSessionService.exportAuditData();
      await openJsonDocument(data || 'Nenhum registro de auditoria encontrado.');
    }),
    vscode.commands.registerCommand('codeReview.exportLocalDatabase', async () => {
      const data = await reviewSessionService.exportLocalDatabase();
      await openJsonDocument(data);
    }),
    vscode.commands.registerCommand('codeReview.createBackup', async () => {
      const backupPath = await reviewSessionService.createBackup();
      vscode.window.showInformationMessage(`Backup de Code Review criado em: ${backupPath}`);
    }),
    vscode.commands.registerCommand('codeReview.syncRemote', async () => {
      const syncedPath = await reviewSessionService.syncRemote();
      vscode.window.showInformationMessage(`Sincronizacao de Code Review concluida em: ${syncedPath}`);
    })
  );
}

async function openJsonDocument(content: string): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    content,
    language: 'json'
  });

  await vscode.window.showTextDocument(document, { preview: false });
}

export function deactivate(): void {}
