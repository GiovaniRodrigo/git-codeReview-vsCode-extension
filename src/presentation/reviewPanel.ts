import * as vscode from 'vscode';
import { ReviewSessionService } from '../application/reviewSessionService';

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

  private async handleMessage(message: { type?: string }): Promise<void> {
    if (message.type === 'requestState') {
      await this.postState();
    }

    if (message.type === 'startReview') {
      await this.startReview();
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
