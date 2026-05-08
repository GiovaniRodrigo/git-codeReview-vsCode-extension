import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('codeReview.openDashboard', () => openReviewPanel(context, 'dashboard')),
    vscode.commands.registerCommand('codeReview.startReview', () => openReviewPanel(context, 'analysis')),
    vscode.commands.registerCommand('codeReview.openPullRequest', () => openReviewPanel(context, 'dashboard'))
  );

  openReviewPanel(context, 'dashboard');
}

function openReviewPanel(context: vscode.ExtensionContext, view: 'dashboard' | 'analysis'): void {
  const panel = vscode.window.createWebviewPanel(
    'codeReviewDashboard',
    view === 'dashboard' ? 'Code Review Dashboard' : 'Review Analysis',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist')]
    }
  );

  panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, view);
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

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate(): void {}
