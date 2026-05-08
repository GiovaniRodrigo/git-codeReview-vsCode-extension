import * as vscode from 'vscode';
import { ReviewSessionService } from '../application/reviewSessionService';
import {
  isReviewSessionStatus,
  isValidationFindingStatus,
  isValidationSeverity,
  ReviewNavigationKind
} from '../domain/reviewSession';

type ReviewView = 'dashboard' | 'analysis';

export class ReviewPanel {
  private panel?: vscode.WebviewPanel;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly service: ReviewSessionService
  ) {}

  open(view: ReviewView): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      this.postState();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'codeReviewDashboard',
      view === 'dashboard' ? 'Code Review Dashboard' : 'Review Analysis',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist')]
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage((message) => this.handleMessage(message));
    this.panel.webview.html = getWebviewHtml(this.panel.webview, this.context.extensionUri, view);
    this.postState();
  }

  async startReview(): Promise<void> {
    if (!this.panel) {
      this.open('analysis');
    }

    const author = await getGitUserName();
    const reviewer = vscode.env.machineId;
    const session = await this.service.startReview(author, reviewer);

    this.post({ type: 'reviewSessionStarted', payload: session });
    vscode.window.showInformationMessage('Review session iniciada.');
  }

  private async handleMessage(message: { type?: string; payload?: Record<string, unknown> }): Promise<void> {
    if (message.type === 'requestState') {
      await this.postState();
    }

    if (message.type === 'startReview') {
      await this.startReview();
    }

    if (message.type === 'openReview' && typeof message.payload?.id === 'string') {
      await this.service.openReview(message.payload.id);
      await this.postState();
    }

    if (
      message.type === 'updateReviewStatus'
      && typeof message.payload?.id === 'string'
      && typeof message.payload?.status === 'string'
      && isReviewSessionStatus(message.payload.status)
    ) {
      await this.service.updateStatus(message.payload.id, message.payload.status);
      await this.postState();
    }

    if (
      message.type === 'navigateReview'
      && typeof message.payload?.id === 'string'
      && isNavigationKind(message.payload.kind)
      && typeof message.payload.ref === 'string'
    ) {
      await this.service.navigate(message.payload.id, {
        kind: message.payload.kind,
        ref: message.payload.ref,
        file: typeof message.payload.file === 'string' ? message.payload.file : undefined,
        line: typeof message.payload.line === 'number' ? message.payload.line : undefined
      });
      await this.postState();
    }

    if (
      message.type === 'addReviewComment'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.body === 'string'
      && typeof message.payload.file === 'string'
      && typeof message.payload.line === 'number'
    ) {
      await this.service.addComment(message.payload.id, {
        body: message.payload.body,
        author: vscode.env.machineId,
        file: message.payload.file,
        line: message.payload.line,
        commit: typeof message.payload.commit === 'string' ? message.payload.commit : undefined,
        threadId: typeof message.payload.threadId === 'string' ? message.payload.threadId : undefined
      });
      await this.postState();
    }

    if (
      message.type === 'editReviewComment'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.commentId === 'string'
      && typeof message.payload.body === 'string'
    ) {
      await this.service.editComment(message.payload.id, message.payload.commentId, message.payload.body, vscode.env.machineId);
      await this.postState();
    }

    if (
      message.type === 'createValidationFinding'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.rule === 'string'
      && typeof message.payload.severity === 'string'
      && isValidationSeverity(message.payload.severity)
      && typeof message.payload.description === 'string'
      && typeof message.payload.file === 'string'
      && typeof message.payload.line === 'number'
      && typeof message.payload.commit === 'string'
    ) {
      await this.service.createFinding(message.payload.id, {
        rule: message.payload.rule,
        severity: message.payload.severity,
        description: message.payload.description,
        file: message.payload.file,
        line: message.payload.line,
        commit: message.payload.commit,
        responsible: vscode.env.machineId
      });
      await this.postState();
    }

    if (
      message.type === 'updateValidationFindingStatus'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.findingId === 'string'
      && typeof message.payload.status === 'string'
      && isValidationFindingStatus(message.payload.status)
    ) {
      await this.service.updateFindingStatus(message.payload.id, message.payload.findingId, message.payload.status);
      await this.postState();
    }

    if (
      message.type === 'registerCorrectionAttempt'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.findingId === 'string'
      && typeof message.payload.commit === 'string'
      && typeof message.payload.description === 'string'
    ) {
      await this.service.registerCorrection(message.payload.id, message.payload.findingId, {
        author: vscode.env.machineId,
        commit: message.payload.commit,
        description: message.payload.description
      });
      await this.postState();
    }

    if (
      message.type === 'revalidateFinding'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.findingId === 'string'
      && typeof message.payload.result === 'string'
      && isValidationFindingStatus(message.payload.result)
      && typeof message.payload.notes === 'string'
    ) {
      await this.service.revalidate(message.payload.id, message.payload.findingId, {
        reviewer: vscode.env.machineId,
        result: message.payload.result,
        notes: message.payload.notes
      });
      await this.postState();
    }

    if (message.type === 'runArchitectureValidation' && typeof message.payload?.id === 'string') {
      const result = await this.service.runArchitectureValidation(message.payload.id);
      this.post({ type: 'architectureValidationCompleted', payload: { count: result.findings.length } });
      await this.postState();
    }

    if (
      message.type === 'addCollaborationMessage'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.body === 'string'
    ) {
      await this.service.addCollaborationMessage(message.payload.id, {
        author: vscode.env.machineId,
        body: message.payload.body,
        threadId: typeof message.payload.threadId === 'string' ? message.payload.threadId : undefined
      });
      await this.postState();
    }

    if (
      message.type === 'approvePartial'
      && typeof message.payload?.id === 'string'
      && (message.payload.scope === 'module' || message.payload.scope === 'file')
      && typeof message.payload.target === 'string'
    ) {
      await this.service.approvePartial(message.payload.id, {
        scope: message.payload.scope,
        target: message.payload.target,
        reviewer: vscode.env.machineId
      });
      await this.postState();
    }

    if (message.type === 'refreshMergeDecision' && typeof message.payload?.id === 'string') {
      await this.service.refreshMergeDecision(message.payload.id);
      await this.postState();
    }
  }

  private async postState(): Promise<void> {
    const state = await this.service.getDashboardState();
    this.post({ type: 'dashboardState', payload: state });
  }

  private post(message: unknown): void {
    this.panel?.webview.postMessage(message);
  }
}

function isNavigationKind(value: unknown): value is ReviewNavigationKind {
  return value === 'commit' || value === 'diff' || value === 'file' || value === 'comment' || value === 'validation';
}

function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, initialView = 'dashboard'): string {
  const distUri = vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist');
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'assets', 'index.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'assets', 'index.css'));
  const nonce = getNonce();

  return /* html */ `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Code Review</title>
</head>
<body data-initial-view="${initialView}">
  <div id="root"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
}

async function getGitUserName(): Promise<string> {
  const config = vscode.workspace.getConfiguration('git');
  return config.get<string>('user.name') ?? vscode.env.machineId;
}

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
