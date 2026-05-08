import * as vscode from "vscode";
import { CommitService } from "../git/commitService";
import { CommitSummary, GitRef } from "../git/types";
import { createGitDocumentUri } from "./gitContentProvider";
import { buildReviewModel, ReviewModel } from "./reviewModel";

export class ReviewPanel {
  private static currentPanel: ReviewPanel | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly commitService: CommitService
  ) {
    this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
    this.panel.webview.onDidReceiveMessage((message: WebviewMessage) => this.handleMessage(message), undefined, this.disposables);
  }

  public static async openForRef(context: vscode.ExtensionContext, commitService: CommitService, rootPath: string, ref: GitRef): Promise<void> {
    const panel = ReviewPanel.createOrReuse(context, commitService);
    panel.panel.title = `Review: ${ref.name}`;
    await panel.renderRef(rootPath, ref);
  }

  public static async openForCommit(context: vscode.ExtensionContext, commitService: CommitService, rootPath: string, ref: GitRef, commit: CommitSummary): Promise<void> {
    const panel = ReviewPanel.createOrReuse(context, commitService);
    panel.panel.title = `Review: ${commit.shortHash}`;
    const details = await commitService.getCommitDetails(rootPath, commit.hash);
    panel.render(buildReviewModel(rootPath, ref, [details]));
  }

  private static createOrReuse(context: vscode.ExtensionContext, commitService: CommitService): ReviewPanel {
    if (ReviewPanel.currentPanel) {
      ReviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return ReviewPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel("codeReview.reviewPanel", "Review", vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [context.extensionUri]
    });

    ReviewPanel.currentPanel = new ReviewPanel(panel, commitService);
    return ReviewPanel.currentPanel;
  }

  private async renderRef(rootPath: string, ref: GitRef): Promise<void> {
    const commits = await this.commitService.listCommits(rootPath, ref.name, 100);
    const details = await Promise.all(commits.map((commit) => this.commitService.getCommitDetails(rootPath, commit.hash)));
    this.render(buildReviewModel(rootPath, ref, details));
  }

  private render(model: ReviewModel): void {
    this.panel.webview.html = getHtml(this.panel.webview, model);
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    if (message.command !== "openDiff") {
      return;
    }

    const leftPath = message.previousPath ?? message.path;
    const left = createGitDocumentUri(message.rootPath, `${message.hash}^`, leftPath);
    const right = createGitDocumentUri(message.rootPath, message.hash, message.path);
    await vscode.commands.executeCommand("vscode.diff", left, right, `${message.shortHash}: ${message.path}`);
  }

  private dispose(): void {
    ReviewPanel.currentPanel = undefined;
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }
}

type WebviewMessage = {
  command: "openDiff";
  rootPath: string;
  hash: string;
  shortHash: string;
  path: string;
  previousPath?: string;
};

function getHtml(webview: vscode.Webview, model: ReviewModel): string {
  const nonce = getNonce();
  const payload = escapeJsonForScript(model);
  const cspSource = webview.cspSource;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; style-src 'unsafe-inline' ${cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Review</title>
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
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--surface);
    }
    header, .filters, .summary, main { padding: 12px 16px; }
    header {
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
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
      grid-template-columns: minmax(180px, 1.5fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(140px, 1fr);
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
    main {
      display: grid;
      gap: 10px;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    .commit {
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }
    .commit-head {
      display: grid;
      grid-template-columns: 28px 1fr auto;
      gap: 10px;
      align-items: start;
      padding: 10px;
      border-bottom: 1px solid var(--border);
    }
    .message {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .meta {
      margin-top: 4px;
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .stats {
      white-space: nowrap;
      color: var(--muted);
    }
    .files {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .file {
      display: grid;
      grid-template-columns: 44px 1fr auto;
      gap: 8px;
      align-items: center;
      padding: 7px 10px;
      border-top: 1px solid var(--border);
    }
    .file:first-child { border-top: 0; }
    .status {
      font-family: var(--vscode-editor-font-family);
      color: var(--muted);
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
      .filters { grid-template-columns: 1fr; }
      header, .toolbar { align-items: stretch; flex-direction: column; }
      .commit-head, .file { grid-template-columns: 28px 1fr; }
      .stats, .file button { grid-column: 2; justify-self: start; }
    }
  </style>
</head>
<body>
  <script id="review-data" type="application/json">${payload}</script>
  <header>
    <div>
      <h1 id="title"></h1>
      <div id="subtitle" class="muted"></div>
    </div>
    <div id="selectedCount" class="muted"></div>
  </header>
  <section class="summary" aria-label="Review summary"></section>
  <section class="filters" aria-label="Commit filters">
    <input id="search" type="search" placeholder="Buscar por mensagem, autor, hash ou arquivo">
    <select id="branch"></select>
    <select id="author"></select>
    <input id="date" type="date">
    <select id="file"></select>
  </section>
  <main>
    <div class="toolbar">
      <div id="visibleCount" class="muted"></div>
      <button id="clearSelection">Limpar seleção</button>
    </div>
    <div id="commits"></div>
  </main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const model = JSON.parse(document.getElementById("review-data").textContent);
    const selected = new Set();
    const elements = {
      title: document.getElementById("title"),
      subtitle: document.getElementById("subtitle"),
      summary: document.querySelector(".summary"),
      search: document.getElementById("search"),
      branch: document.getElementById("branch"),
      author: document.getElementById("author"),
      date: document.getElementById("date"),
      file: document.getElementById("file"),
      selectedCount: document.getElementById("selectedCount"),
      visibleCount: document.getElementById("visibleCount"),
      clearSelection: document.getElementById("clearSelection"),
      commits: document.getElementById("commits")
    };

    elements.title.textContent = model.ref.name;
    elements.subtitle.textContent = model.ref.kind === "tag" ? "Tag" : "Branch " + (model.ref.type || "");
    elements.summary.innerHTML = [
      metric(model.totals.commits, "commits"),
      metric(model.totals.files, "arquivos"),
      metric("+" + model.totals.additions, "linhas adicionadas"),
      metric("-" + model.totals.deletions, "linhas removidas")
    ].join("");

    fillSelect(elements.branch, "Todas as branches", model.refs);
    fillSelect(elements.author, "Todos os autores", model.authors);
    fillSelect(elements.file, "Todos os arquivos", model.files);

    for (const input of [elements.search, elements.branch, elements.author, elements.date, elements.file]) {
      input.addEventListener("input", render);
    }
    elements.clearSelection.addEventListener("click", () => {
      selected.clear();
      render();
    });

    function render() {
      const query = elements.search.value.trim().toLowerCase();
      const branch = elements.branch.value;
      const author = elements.author.value;
      const date = elements.date.value;
      const file = elements.file.value;
      const commits = model.commits.filter((commit) => {
        const haystack = [
          commit.hash,
          commit.shortHash,
          commit.message,
          commit.authorName,
          commit.authorEmail || "",
          commit.files.map((item) => item.path).join(" ")
        ].join(" ").toLowerCase();
        const commitDate = commit.date.slice(0, 10);
        return (!query || haystack.includes(query))
          && (!branch || commit.refName === branch)
          && (!author || commit.authorName === author)
          && (!date || commitDate === date)
          && (!file || commit.files.some((item) => item.path === file));
      });

      elements.visibleCount.textContent = commits.length + " commit(s) visíveis";
      elements.selectedCount.textContent = selected.size + " commit(s) selecionado(s)";
      elements.commits.innerHTML = commits.length ? commits.map(renderCommit).join("") : '<div class="empty">Nenhum commit encontrado.</div>';
    }

    function renderCommit(commit) {
      const checked = selected.has(commit.hash) ? "checked" : "";
      return '<article class="commit">'
        + '<div class="commit-head">'
        + '<input type="checkbox" aria-label="Selecionar commit" data-select="' + escapeAttr(commit.hash) + '" ' + checked + '>'
        + '<div><div class="message">' + escapeHtml(commit.message) + '</div>'
        + '<div class="meta"><span>' + escapeHtml(commit.shortHash) + '</span><span>' + escapeHtml(commit.authorName) + '</span><span>' + formatDate(commit.date) + '</span><span>' + escapeHtml(commit.hash) + '</span></div></div>'
        + '<div class="stats">+' + commit.additions + ' -' + commit.deletions + '</div>'
        + '</div>'
        + '<ul class="files">' + commit.files.map((file) => renderFile(commit, file)).join("") + '</ul>'
        + '</article>';
    }

    function renderFile(commit, file) {
      return '<li class="file">'
        + '<span class="status">' + escapeHtml(file.status) + '</span>'
        + '<span title="' + escapeAttr(file.previousPath ? file.previousPath + " -> " + file.path : file.path) + '">' + escapeHtml(file.path) + '</span>'
        + '<button data-diff="' + escapeAttr(commit.hash) + '" data-path="' + escapeAttr(file.path) + '" data-previous-path="' + escapeAttr(file.previousPath || "") + '">Diff +' + file.additions + ' -' + file.deletions + '</button>'
        + '</li>';
    }

    elements.commits.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-select]");
      if (!checkbox) return;
      checkbox.checked ? selected.add(checkbox.dataset.select) : selected.delete(checkbox.dataset.select);
      elements.selectedCount.textContent = selected.size + " commit(s) selecionado(s)";
    });

    elements.commits.addEventListener("click", (event) => {
      const button = event.target.closest("[data-diff]");
      if (!button) return;
      const commit = model.commits.find((item) => item.hash === button.dataset.diff);
      vscode.postMessage({
        command: "openDiff",
        rootPath: model.rootPath,
        hash: commit.hash,
        shortHash: commit.shortHash,
        path: button.dataset.path,
        previousPath: button.dataset.previousPath || undefined
      });
    });

    function metric(value, label) {
      return '<div class="metric"><strong>' + escapeHtml(String(value)) + '</strong><span class="muted">' + escapeHtml(label) + '</span></div>';
    }

    function fillSelect(select, label, options) {
      select.innerHTML = '<option value="">' + escapeHtml(label) + '</option>' + options.map((option) => '<option value="' + escapeAttr(option) + '">' + escapeHtml(option) + '</option>').join("");
    }

    function formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? escapeHtml(value) : escapeHtml(date.toLocaleString());
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}

function escapeJsonForScript(value: ReviewModel): string {
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
