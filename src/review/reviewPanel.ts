import * as vscode from "vscode";
import { CommitService } from "../git/commitService";
import { CommitSummary, GitRef } from "../git/types";
import { ReviewState } from "../productivity/reviewState";
import { createGitDocumentUri } from "./gitContentProvider";
import { buildReviewModel, ReviewModel } from "./reviewModel";
import { getCommonStyles } from "./styles";

export class ReviewPanel {
  private static currentPanel: ReviewPanel | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly commitService: CommitService,
    private readonly reviewState: ReviewState
  ) {
    this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
    this.panel.webview.onDidReceiveMessage((message: WebviewMessage) => this.handleMessage(message), undefined, this.disposables);
  }

  public static async openForRef(context: vscode.ExtensionContext, commitService: CommitService, reviewState: ReviewState, rootPath: string, ref: GitRef): Promise<void> {
    const panel = ReviewPanel.createOrReuse(context, commitService, reviewState);
    panel.panel.title = `Review: ${ref.name}`;
    await panel.renderRef(rootPath, ref);
  }

  public static async openForCommit(context: vscode.ExtensionContext, commitService: CommitService, reviewState: ReviewState, rootPath: string, ref: GitRef, commit: CommitSummary): Promise<void> {
    const panel = ReviewPanel.createOrReuse(context, commitService, reviewState);
    panel.panel.title = `Review: ${commit.shortHash}`;
    const details = await commitService.getCommitDetails(rootPath, commit.hash);
    panel.render(buildReviewModel(rootPath, ref, [details], reviewState.getReviewedFiles(rootPath)));
  }

  private static createOrReuse(context: vscode.ExtensionContext, commitService: CommitService, reviewState: ReviewState): ReviewPanel {
    if (ReviewPanel.currentPanel) {
      ReviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return ReviewPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel("codeReview.reviewPanel", "Review", vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [context.extensionUri]
    });

    ReviewPanel.currentPanel = new ReviewPanel(panel, commitService, reviewState);
    return ReviewPanel.currentPanel;
  }

  private async renderRef(rootPath: string, ref: GitRef): Promise<void> {
    const commits = await this.commitService.listCommits(rootPath, ref.name, 100);
    const details = await Promise.all(commits.map((commit) => this.commitService.getCommitDetails(rootPath, commit.hash)));
    this.render(buildReviewModel(rootPath, ref, details, this.reviewState.getReviewedFiles(rootPath)));
  }

  private render(model: ReviewModel): void {
    this.panel.webview.html = getHtml(this.panel.webview, model);
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    if (message.command === "markFileReviewed") {
      await this.reviewState.markFileReviewed(message.rootPath, message.hash, message.path);
      return;
    }

    if (message.command === "reviewSelected") {
      vscode.window.showInformationMessage(`Creating review process for ${message.hashes?.length} selected commits...`);
      // Future: integrate with codeReview.createReviewProcess
      return;
    }

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
  command: "openDiff" | "markFileReviewed" | "reviewSelected";
  rootPath: string;
  hash: string;
  shortHash: string;
  path: string;
  previousPath?: string;
  hashes?: string[];
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
    ${getCommonStyles()}
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
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-bottom: 1px solid var(--border);
    }
    .filter-row {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 8px;
      align-items: center;
    }
    .filter-secondary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      padding-top: 4px;
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
    .actions {
      display: flex;
      gap: 8px;
    }
    .commit {
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .commit-head {
      display: grid;
      grid-template-columns: 28px 24px 1fr auto;
      gap: 10px;
      align-items: start;
      padding: 10px;
      cursor: pointer;
      user-select: none;
    }
    .commit-head:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .commit.expanded .commit-head {
      border-bottom: 1px solid var(--border);
    }
    .toggle-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      transition: transform 0.2s ease;
    }
    .commit.expanded .toggle-icon {
      transform: rotate(90deg);
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
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .files {
      margin: 0;
      padding: 0;
      list-style: none;
      display: none;
    }
    .commit.expanded .files {
      display: block;
    }
    .file {
      display: grid;
      grid-template-columns: 44px 1fr 100px 80px 80px auto;
      gap: 12px;
      align-items: center;
      padding: 7px 10px;
      border-top: 1px solid var(--border);
    }
    .file-actions {
      display: flex;
      gap: 8px;
    }
    .file:first-child { border-top: 0; }
    .status {
      font-family: var(--vscode-editor-font-family);
      color: var(--muted);
    }
    .path {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .category {
      color: var(--muted);
      white-space: nowrap;
      font-size: 11px;
      text-transform: uppercase;
    }
    .stats {
      white-space: nowrap;
      font-size: 12px;
      text-align: right;
    }
    .stats-add { color: var(--vscode-testing-iconPassed); }
    .stats-del { color: var(--vscode-editorError-foreground); }
    .reviewed-label {
      color: var(--vscode-testing-iconPassed);
      font-size: 11px;
      margin-left: 4px;
    }
    .empty {
      color: var(--muted);
      padding: 24px 0;
    }
    @media (max-width: 900px) {
      .file { grid-template-columns: 44px 1fr 80px auto; }
      .category, .risk { display: none; }
    }
    @media (max-width: 720px) {
      .filter-row { grid-template-columns: 1fr; }
      header, .toolbar { align-items: stretch; flex-direction: column; }
      .commit-head, .file { grid-template-columns: 28px 1fr; }
      .stats, .file-actions { grid-column: 2; justify-self: start; }
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
    <div class="filter-row">
      <input id="search" type="search" placeholder="Search message, author, hash or file" title="Filters commits by message, author, hash, file, category or risk reason" aria-label="Search commits">
      <select id="risk" title="Filters commits and files by risk level" aria-label="Filter by risk"></select>
      <select id="reviewStatus" title="Filters reviewed or unreviewed files" aria-label="Filter by review state"></select>
      <button id="toggleFilters" class="secondary" title="Show more filters" aria-label="Toggle more filters">More Filters</button>
    </div>
    <div id="secondaryFilters" class="filter-secondary hidden">
      <select id="branch" title="Filters commits by selected branch or tag" aria-label="Filter by branch"></select>
      <select id="author" title="Filters commits by author" aria-label="Filter by author"></select>
      <input id="date" type="date" title="Filters commits by date" aria-label="Filter by date">
      <select id="file" title="Filters commits that change a specific file" aria-label="Filter by file"></select>
    </div>
  </section>
  <main>
    <div class="toolbar">
      <div id="visibleCount" class="muted"></div>
      <div class="actions">
        <button id="reviewSelected" title="Create review process for selected commits" aria-label="Review selected commits" class="hidden">Review Selected</button>
        <button id="clearSelection" title="Remove all selected commits" aria-label="Clear commit selection" class="secondary hidden">Clear Selection</button>
      </div>
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
      risk: document.getElementById("risk"),
      reviewStatus: document.getElementById("reviewStatus"),
      branch: document.getElementById("branch"),
      author: document.getElementById("author"),
      date: document.getElementById("date"),
      file: document.getElementById("file"),
      toggleFilters: document.getElementById("toggleFilters"),
      secondaryFilters: document.getElementById("secondaryFilters"),
      selectedCount: document.getElementById("selectedCount"),
      visibleCount: document.getElementById("visibleCount"),
      reviewSelected: document.getElementById("reviewSelected"),
      clearSelection: document.getElementById("clearSelection"),
      commits: document.getElementById("commits")
    };

    elements.title.textContent = model.ref.name;
    elements.subtitle.textContent = model.ref.kind === "tag" ? "Tag" : "Branch " + (model.ref.type || "");
    fillSelect(elements.risk, "All risks", ["high", "medium", "low"]);
    fillSelect(elements.reviewStatus, "All states", ["unreviewed", "reviewed"]);
    fillSelect(elements.branch, "All branches", model.refs);
    fillSelect(elements.author, "All authors", model.authors);
    fillSelect(elements.file, "All files", model.files);

    for (const input of [elements.search, elements.risk, elements.reviewStatus, elements.branch, elements.author, elements.date, elements.file]) {
      input.addEventListener("input", render);
    }
    elements.clearSelection.addEventListener("click", () => {
      selected.clear();
      render();
    });
    elements.toggleFilters.addEventListener("click", () => {
      elements.secondaryFilters.classList.toggle("hidden");
      elements.toggleFilters.textContent = elements.secondaryFilters.classList.contains("hidden") ? "More Filters" : "Less Filters";
    });
    elements.reviewSelected.addEventListener("click", () => {
      vscode.postMessage({
        command: "reviewSelected",
        rootPath: model.rootPath,
        hashes: Array.from(selected)
      });
    });

    function render() {
      renderSummary();
      const query = elements.search.value.trim().toLowerCase();
      const risk = elements.risk.value;
      const reviewStatus = elements.reviewStatus.value;
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
          commit.reviewReason,
          commit.files.map((item) => [item.path, item.category, item.risk, item.reviewReason].join(" ")).join(" ")
        ].join(" ").toLowerCase();
        const commitDate = commit.date.slice(0, 10);
        return (!query || haystack.includes(query))
          && (!risk || commit.risk === risk || commit.files.some((item) => item.risk === risk))
          && (!reviewStatus || commit.files.some((item) => reviewStatus === "reviewed" ? item.reviewed : !item.reviewed))
          && (!branch || commit.refName === branch)
          && (!author || commit.authorName === author)
          && (!date || commitDate === date)
          && (!file || commit.files.some((item) => item.path === file));
      }).slice().sort((left, right) => right.riskScore - left.riskScore || new Date(right.date).getTime() - new Date(left.date).getTime());

      elements.visibleCount.textContent = commits.length + " commit(s) visible";
      elements.selectedCount.textContent = selected.size > 0 ? selected.size + " commit(s) selected" : "";
      
      elements.clearSelection.classList.toggle("hidden", selected.size === 0);
      elements.reviewSelected.classList.toggle("hidden", selected.size === 0);

      if (commits.length) {
        elements.commits.innerHTML = commits.map(renderCommit).join("");
      } else {
        elements.commits.innerHTML = renderPlaceholder(
          query || risk || reviewStatus || branch || author || date || file 
            ? "No commits match your filters." 
            : "No commits found in this branch/tag.",
          "Try adjusting your search or filters to see more results."
        );
      }
    }

    function renderPlaceholder(title, text) {
      return '<div class="placeholder">'
        + '<div class="placeholder-title">' + escapeHtml(title) + '</div>'
        + '<div class="placeholder-text">' + escapeHtml(text) + '</div>'
        + '</div>';
    }

    function renderSummary() {
      elements.summary.innerHTML = [
        metric(model.totals.commits, "commits", "Total commits loaded in the panel"),
        metric(model.totals.files, "files", "Total unique changed files"),
        metric(model.totals.highRiskFiles, "high risk files", "Files classified as high risk by local heuristics"),
        metric(model.totals.reviewedFiles + "/" + (model.totals.reviewedFiles + model.totals.unreviewedFiles), "reviewed files", "Local progress of files marked as reviewed"),
        metric("+" + model.totals.additions, "lines added", "Total lines added"),
        metric("-" + model.totals.deletions, "lines removed", "Total lines removed")
      ].join("");
    }

    function renderCommit(commit) {
      const checked = selected.has(commit.hash) ? "checked" : "";
      const files = visibleFiles(commit);
      return '<article class="commit" id="commit-' + commit.hash + '">'
        + '<div class="commit-head" data-toggle="' + commit.hash + '">'
        + '<input type="checkbox" aria-label="Select commit ' + escapeAttr(commit.shortHash) + '" title="Select this commit for panel follow-up" data-select="' + escapeAttr(commit.hash) + '" ' + checked + '>'
        + '<div class="toggle-icon">▶</div>'
        + '<div><div class="message">' + escapeHtml(commit.message) + '</div>'
        + '<div class="meta"><span>' + escapeHtml(commit.shortHash) + '</span><span>' + escapeHtml(commit.authorName) + '</span><span>' + formatDate(commit.date) + '</span><span>' + escapeHtml(commit.hash) + '</span><span>' + escapeHtml(commit.reviewReason) + '</span></div></div>'
        + '<div class="stats"><span class="risk risk-' + escapeAttr(commit.risk) + '" title="' + escapeAttr(commit.reviewReason) + '">' + escapeHtml(commit.risk) + '</span><span title="Lines added and removed in this commit">+' + commit.additions + ' -' + commit.deletions + '</span></div>'
        + '</div>'
        + '<ul class="files">' + files.map((file) => renderFile(commit, file)).join("") + '</ul>'
        + '</article>';
    }

    function visibleFiles(commit) {
      const reviewStatus = elements.reviewStatus.value;
      const risk = elements.risk.value;
      const file = elements.file.value;
      return commit.files.filter((item) => {
        return (!reviewStatus || (reviewStatus === "reviewed" ? item.reviewed : !item.reviewed))
          && (!risk || item.risk === risk)
          && (!file || item.path === file);
      });
    }

    function renderFile(commit, file) {
      return '<li class="file">'
        + '<span class="status" title="File status: ' + escapeAttr(file.status) + '">' + escapeHtml(file.status) + '</span>'
        + '<span class="path" title="' + escapeAttr(fileTooltip(file)) + '">' + escapeHtml(file.path) + reviewedText(file) + '</span>'
        + '<span class="category">' + escapeHtml(file.category) + '</span>'
        + '<span class="risk risk-' + escapeAttr(file.risk) + '">' + escapeHtml(file.risk) + '</span>'
        + '<span class="stats"><span class="stats-add">+' + file.additions + '</span> <span class="stats-del">-' + file.deletions + '</span></span>'
        + '<div class="file-actions">'
        + '<button data-reviewed="' + escapeAttr(commit.hash) + '" data-path="' + escapeAttr(file.path) + '" title="' + escapeAttr(file.reviewed ? "File already marked as reviewed" : "Mark this file as reviewed locally") + '" aria-label="' + escapeAttr(file.reviewed ? "File reviewed" : "Mark file as reviewed") + '" ' + (file.reviewed ? "disabled" : "") + '>' + (file.reviewed ? "Reviewed" : "Mark") + '</button>'
        + '<button data-diff="' + escapeAttr(commit.hash) + '" data-path="' + escapeAttr(file.path) + '" data-previous-path="' + escapeAttr(file.previousPath || "") + '" title="Opens native VS Code diff for this file" aria-label="Open diff for ' + escapeAttr(file.path) + '">Diff</button>'
        + '</div>'
        + '</li>';
    }

    elements.commits.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-select]");
      if (!checkbox) return;
      checkbox.checked ? selected.add(checkbox.dataset.select) : selected.delete(checkbox.dataset.select);
      render();
    });

    elements.commits.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-toggle]");
      if (toggle && !event.target.closest("[data-select]")) {
        const commitId = toggle.dataset.toggle;
        const commitEl = document.getElementById("commit-" + commitId);
        commitEl.classList.toggle("expanded");
        return;
      }

      const reviewedButton = event.target.closest("[data-reviewed]");
      if (reviewedButton) {
        const commit = model.commits.find((item) => item.hash === reviewedButton.dataset.reviewed);
        const file = commit?.files.find((item) => item.path === reviewedButton.dataset.path);
        if (!commit || !file || file.reviewed) return;
        file.reviewed = true;
        model.totals.reviewedFiles += 1;
        model.totals.unreviewedFiles -= 1;
        vscode.postMessage({
          command: "markFileReviewed",
          rootPath: model.rootPath,
          hash: commit.hash,
          shortHash: commit.shortHash,
          path: file.path
        });
        render();
        return;
      }

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

    function metric(value, label, title) {
      return '<div class="metric" title="' + escapeAttr(title) + '"><strong>' + escapeHtml(String(value)) + '</strong><span class="muted">' + escapeHtml(label) + '</span></div>';
    }

    function fillSelect(select, label, options) {
      select.innerHTML = '<option value="">' + escapeHtml(label) + '</option>' + options.map((option) => '<option value="' + escapeAttr(option) + '">' + escapeHtml(option) + '</option>').join("");
    }

    function fileTooltip(file) {
      const path = file.previousPath ? file.previousPath + " -> " + file.path : file.path;
      return path + "\\n" + file.reviewReason;
    }

    function reviewedText(file) {
      return file.reviewed ? ' <span class="reviewed-label">reviewed</span>' : "";
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
