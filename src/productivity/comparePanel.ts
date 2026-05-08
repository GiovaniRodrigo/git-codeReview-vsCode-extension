import * as vscode from "vscode";
import { createGitDocumentUri } from "../review/gitContentProvider";
import { CompareModel } from "./compareModel";

export class ComparePanel {
  public static open(model: CompareModel): void {
    const panel = vscode.window.createWebviewPanel("codeReview.comparePanel", `Compare: ${model.base}...${model.head}`, vscode.ViewColumn.One, {
      enableScripts: true
    });
    panel.webview.html = renderHtml(panel.webview, model);
    panel.webview.onDidReceiveMessage(async (message: CompareMessage) => {
      if (message.command !== "openDiff") {
        return;
      }

      const leftPath = message.previousPath ?? message.path;
      const left = createGitDocumentUri(message.rootPath, message.base, leftPath);
      const right = createGitDocumentUri(message.rootPath, message.head, message.path);
      await vscode.commands.executeCommand("vscode.diff", left, right, `${message.base}...${message.head}: ${message.path}`);
    });
  }
}

type CompareMessage = {
  command: "openDiff";
  rootPath: string;
  base: string;
  head: string;
  path: string;
  previousPath?: string;
};

function renderHtml(webview: vscode.Webview, model: CompareModel): string {
  const nonce = getNonce();
  const payload = escapeJsonForScript(model);
  const cspSource = webview.cspSource;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; style-src 'unsafe-inline' ${cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compare Changes</title>
  <style>
    :root {
      color-scheme: light dark;
      --border: var(--vscode-panel-border);
      --muted: var(--vscode-descriptionForeground);
      --surface: var(--vscode-editor-background);
      --field: var(--vscode-input-background);
      --field-border: var(--vscode-input-border);
      --accent: var(--vscode-button-background);
      --accent-text: var(--vscode-button-foreground);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--vscode-foreground);
      background: var(--surface);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    header, .summary, .filters, main { padding: 12px 16px; }
    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--border);
    }
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .muted { color: var(--muted); }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      border-bottom: 1px solid var(--border);
    }
    .metric {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px;
      min-height: 58px;
    }
    .metric strong {
      display: block;
      font-size: 18px;
      margin-bottom: 2px;
    }
    .filters {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) minmax(140px, 220px);
      gap: 8px;
      border-bottom: 1px solid var(--border);
    }
    input, select {
      width: 100%;
      min-height: 30px;
      color: var(--vscode-input-foreground);
      background: var(--field);
      border: 1px solid var(--field-border);
      border-radius: 4px;
      padding: 5px 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 7px 8px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: middle;
    }
    th {
      color: var(--muted);
      font-weight: 600;
    }
    .status {
      width: 52px;
      color: var(--muted);
      font-family: var(--vscode-editor-font-family);
    }
    .stats {
      width: 100px;
      white-space: nowrap;
      color: var(--muted);
    }
    .path {
      overflow-wrap: anywhere;
    }
    button {
      min-height: 28px;
      color: var(--accent-text);
      background: var(--accent);
      border: 0;
      border-radius: 4px;
      padding: 4px 10px;
      cursor: pointer;
    }
    .empty {
      color: var(--muted);
      padding: 24px 0;
    }
    @media (max-width: 720px) {
      header { flex-direction: column; }
      .filters { grid-template-columns: 1fr; }
      th:nth-child(3), td:nth-child(3) { display: none; }
    }
  </style>
</head>
<body>
  <script id="compare-data" type="application/json">${payload}</script>
  <header>
    <div>
      <h1>Compare Changes</h1>
      <div class="muted" id="subtitle"></div>
    </div>
    <div class="muted" id="visibleCount"></div>
  </header>
  <section class="summary" aria-label="Compare summary"></section>
  <section class="filters" aria-label="Compare filters">
    <input id="search" type="search" placeholder="Search file" title="Filters changed files by current or previous path" aria-label="Search changed file">
    <select id="status" title="Filters files by Git change status" aria-label="Filter by file status"></select>
  </section>
  <main id="files"></main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const model = JSON.parse(document.getElementById("compare-data").textContent);
    const elements = {
      subtitle: document.getElementById("subtitle"),
      visibleCount: document.getElementById("visibleCount"),
      summary: document.querySelector(".summary"),
      search: document.getElementById("search"),
      status: document.getElementById("status"),
      files: document.getElementById("files")
    };

    elements.subtitle.textContent = model.base + "..." + model.head;
    elements.summary.innerHTML = [
      metric(model.totals.files, "files", "Total changed files between branches"),
      metric("+" + model.totals.additions, "lines added", "Total lines added in comparison"),
      metric("-" + model.totals.deletions, "lines removed", "Total lines removed in comparison")
    ].join("");
    fillSelect(elements.status, "All statuses", unique(model.files.map((file) => file.status)));

    for (const input of [elements.search, elements.status]) {
      input.addEventListener("input", render);
    }

    function render() {
      const query = elements.search.value.trim().toLowerCase();
      const status = elements.status.value;
      const files = model.files.filter((file) => {
        return (!query || file.path.toLowerCase().includes(query) || (file.previousPath || "").toLowerCase().includes(query))
          && (!status || file.status === status);
      });

      elements.visibleCount.textContent = files.length + " file(s)";
      elements.files.innerHTML = files.length ? renderTable(files) : '<div class="empty">No changes found.</div>';
    }

    function renderTable(files) {
      return '<table><thead><tr><th title="Git status of the file">Status</th><th title="Changed file">File</th><th title="Lines added and removed">Lines</th><th title="Diff actions"></th></tr></thead><tbody>'
        + files.map(renderFile).join("")
        + '</tbody></table>';
    }

    function renderFile(file) {
      return '<tr>'
        + '<td class="status" title="' + escapeAttr(statusTooltip(file.status)) + '">' + escapeHtml(statusLabel(file.status)) + '</td>'
        + '<td class="path" title="' + escapeAttr(file.previousPath ? file.previousPath + " -> " + file.path : file.path) + '">' + escapeHtml(file.previousPath ? file.previousPath + " -> " + file.path : file.path) + '</td>'
        + '<td class="stats" title="Lines added and removed">+' + file.additions + ' -' + file.deletions + '</td>'
        + '<td><button data-path="' + escapeAttr(file.path) + '" data-previous-path="' + escapeAttr(file.previousPath || "") + '" title="Opens native VS Code diff for this file" aria-label="Open diff for ' + escapeAttr(file.path) + '">Open Diff</button></td>'
        + '</tr>';
    }

    elements.files.addEventListener("click", (event) => {
      const button = event.target.closest("[data-path]");
      if (!button) return;
      vscode.postMessage({
        command: "openDiff",
        rootPath: model.rootPath,
        base: model.base,
        head: model.head,
        path: button.dataset.path,
        previousPath: button.dataset.previousPath || undefined
      });
    });

    function metric(value, label, title) {
      return '<div class="metric" title="' + escapeAttr(title) + '"><strong>' + escapeHtml(String(value)) + '</strong><span class="muted">' + escapeHtml(label) + '</span></div>';
    }

    function fillSelect(select, label, options) {
      select.innerHTML = '<option value="">' + escapeHtml(label) + '</option>' + options.map((option) => '<option value="' + escapeAttr(option) + '">' + escapeHtml(statusLabel(option)) + '</option>').join("");
    }

    function unique(values) {
      return Array.from(new Set(values)).sort();
    }

    function statusLabel(status) {
      return ({ added: "A", modified: "M", deleted: "D", renamed: "R", copied: "C" }[status]) || status;
    }

    function statusTooltip(status) {
      return ({
        added: "File added",
        modified: "File modified",
        deleted: "File removed",
        renamed: "File renamed",
        copied: "File copied"
      }[status]) || status;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }

    function escapeAttr(value) {
      return escapeHtml(value);
    }

    render();
  </script>
</body>
</html>`;
}

function escapeJsonForScript(value: CompareModel): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i += 1) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
