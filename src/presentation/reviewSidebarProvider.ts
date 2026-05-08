import * as vscode from 'vscode';
import { ReviewSessionService } from '../application/reviewSessionService';

export class ReviewSidebarProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'codeReview.sidebar';

  constructor(private readonly service: ReviewSessionService) {}

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    const state = await this.service.getDashboardState();
    const session = state.currentSession;

    webviewView.webview.options = { enableScripts: false };
    webviewView.webview.html = `<!doctype html>
<html lang="pt-BR">
<body style="font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px;">
  <h2 style="font-size: 16px;">Code Review</h2>
  <p><strong>Branch:</strong> ${escapeHtml(state.git.currentBranch)}</p>
  <p><strong>Destino:</strong> ${escapeHtml(state.git.baseBranch)}</p>
  <p><strong>Status:</strong> ${escapeHtml(session?.status ?? 'sem sessao')}</p>
  <p><strong>Arquivos alterados:</strong> ${state.git.changedFiles.length}</p>
</body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
