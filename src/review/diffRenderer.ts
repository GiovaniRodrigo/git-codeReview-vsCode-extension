import * as vscode from "vscode";
import { GitService } from "../git/gitService";

export class DiffRenderer {
  public constructor(private readonly git: GitService) {}

  public async openPatch(rootPath: string, hash: string, filePath?: string): Promise<void> {
    const args = ["show", "--format=", "--patch", "--find-renames", hash];
    if (filePath) {
      args.push("--", filePath);
    }

    const patch = await this.git.run(args, rootPath);
    const panel = vscode.window.createWebviewPanel("codeReview.githubDiff", `Diff ${hash.slice(0, 8)}`, vscode.ViewColumn.One, {
      enableScripts: false
    });
    panel.webview.html = renderPatch(patch || "Sem diff para exibir.");
  }
}

function renderPatch(patch: string): string {
  const lines = patch.split(/\r?\n/);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diff</title>
  <style>
    body {
      margin: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
    }
    table { width: 100%; border-collapse: collapse; }
    td {
      padding: 2px 8px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .ln {
      width: 1%;
      color: var(--vscode-descriptionForeground);
      text-align: right;
      user-select: none;
    }
    .add { background: rgba(46, 160, 67, 0.18); }
    .del { background: rgba(248, 81, 73, 0.18); }
    .meta { color: var(--vscode-descriptionForeground); background: var(--vscode-sideBar-background); }
  </style>
</head>
<body>
  <table>
    <tbody>
      ${lines.map((line, index) => renderLine(line, index + 1)).join("")}
    </tbody>
  </table>
</body>
</html>`;
}

function renderLine(line: string, lineNumber: number): string {
  const kind = line.startsWith("+") && !line.startsWith("+++") ? "add" : line.startsWith("-") && !line.startsWith("---") ? "del" : line.startsWith("@@") || line.startsWith("diff ") || line.startsWith("index ") ? "meta" : "";
  return `<tr class="${kind}"><td class="ln">${lineNumber}</td><td>${escapeHtml(line)}</td></tr>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}
