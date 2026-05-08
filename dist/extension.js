"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode2 = __toESM(require("vscode"));

// src/domain/reviewSession.ts
var REVIEW_SESSION_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "NEEDS_CHANGES",
  "FIXED",
  "APPROVED",
  "REOPENED"
];
var VALIDATION_FINDING_STATUSES = ["NEEDS_CHANGES", "FIXED", "APPROVED", "REOPENED"];
var VALIDATION_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
function isReviewSessionStatus(value) {
  return REVIEW_SESSION_STATUSES.includes(value);
}
function createReviewSession(input) {
  if (!input.git.currentBranch) {
    throw new Error("A branch origem e obrigatoria para criar uma review session.");
  }
  if (!input.git.baseBranch) {
    throw new Error("A branch destino e obrigatoria para criar uma review session.");
  }
  if (!input.author) {
    throw new Error("O autor e obrigatorio para criar uma review session.");
  }
  if (!input.reviewer) {
    throw new Error("O reviewer e obrigatorio para criar uma review session.");
  }
  const now = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const id = input.id ?? `review-${Date.now()}`;
  return {
    id,
    sourceBranch: input.git.currentBranch,
    targetBranch: input.git.baseBranch,
    author: input.author,
    reviewer: input.reviewer,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
    pullRequestId: input.git.pullRequestId,
    changedFiles: input.git.changedFiles,
    commits: input.git.commits,
    comments: [],
    findings: [],
    history: [
      {
        id: `${id}-created`,
        type: "SESSION_CREATED",
        message: `Review criada para ${input.git.currentBranch} -> ${input.git.baseBranch}`,
        createdAt: now
      }
    ]
  };
}
function isValidationFindingStatus(value) {
  return VALIDATION_FINDING_STATUSES.includes(value);
}
function isValidationSeverity(value) {
  return VALIDATION_SEVERITIES.includes(value);
}
function createValidationFinding(session, input) {
  validateFindingInput(input);
  const findings = session.findings ?? [];
  const createdAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const id = input.id ?? `${session.id}-finding-${findings.length + 1}`;
  const finding = {
    id,
    rule: input.rule.trim(),
    severity: input.severity,
    status: "NEEDS_CHANGES",
    description: input.description.trim(),
    file: input.file.trim(),
    line: input.line,
    commit: input.commit.trim(),
    responsible: input.responsible.trim(),
    createdAt,
    updatedAt: createdAt,
    comments: [],
    statusHistory: [{ status: "NEEDS_CHANGES", changedAt: createdAt }],
    correctionAttempts: [],
    revalidations: []
  };
  return {
    ...session,
    findings: [...findings, finding],
    updatedAt: createdAt,
    history: appendHistory(session, "FINDING_CREATED", `Validacao criada: ${finding.rule} em ${finding.file}:${finding.line}`, createdAt)
  };
}
function updateValidationFindingStatus(session, findingId, status, reason = "", now = /* @__PURE__ */ new Date()) {
  const { finding, findings } = findFinding(session, findingId);
  const updatedAt = now.toISOString();
  return {
    ...session,
    findings: findings.map((item) => item.id === findingId ? {
      ...item,
      status,
      updatedAt,
      statusHistory: [...item.statusHistory, { status, changedAt: updatedAt, reason: reason || void 0 }]
    } : item),
    updatedAt,
    history: appendHistory(session, "FINDING_STATUS_CHANGED", `Status da validacao ${finding.rule} alterado para ${status}`, updatedAt)
  };
}
function registerCorrectionAttempt(session, findingId, input) {
  if (!input.author.trim()) throw new Error("O autor da correcao e obrigatorio.");
  if (!input.commit.trim()) throw new Error("O commit da correcao e obrigatorio.");
  if (!input.description.trim()) throw new Error("A descricao da correcao e obrigatoria.");
  const { finding, findings } = findFinding(session, findingId);
  const createdAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const attempt = {
    id: input.id ?? `${findingId}-correction-${finding.correctionAttempts.length + 1}`,
    author: input.author.trim(),
    commit: input.commit.trim(),
    description: input.description.trim(),
    createdAt
  };
  return {
    ...session,
    findings: findings.map((item) => item.id === findingId ? {
      ...item,
      status: "FIXED",
      updatedAt: createdAt,
      correctionAttempts: [...item.correctionAttempts, attempt],
      statusHistory: [...item.statusHistory, { status: "FIXED", changedAt: createdAt, reason: "Correcao registrada" }]
    } : item),
    updatedAt: createdAt,
    history: appendHistory(session, "CORRECTION_REGISTERED", `Correcao registrada para ${finding.rule}`, createdAt)
  };
}
function revalidateFinding(session, findingId, input) {
  if (!input.reviewer.trim()) throw new Error("O reviewer da revalidacao e obrigatorio.");
  if (!input.notes.trim()) throw new Error("As notas da revalidacao sao obrigatorias.");
  const { finding, findings } = findFinding(session, findingId);
  const createdAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const revalidation = {
    id: input.id ?? `${findingId}-revalidation-${finding.revalidations.length + 1}`,
    reviewer: input.reviewer.trim(),
    result: input.result,
    notes: input.notes.trim(),
    createdAt
  };
  return {
    ...session,
    findings: findings.map((item) => item.id === findingId ? {
      ...item,
      status: input.result,
      updatedAt: createdAt,
      revalidations: [...item.revalidations, revalidation],
      statusHistory: [...item.statusHistory, { status: input.result, changedAt: createdAt, reason: "Revalidacao" }]
    } : item),
    updatedAt: createdAt,
    history: appendHistory(session, "FINDING_REVALIDATED", `Validacao revalidada: ${finding.rule} -> ${input.result}`, createdAt)
  };
}
function addReviewComment(session, input) {
  if (!input.body.trim()) {
    throw new Error("O comentario nao pode ser vazio.");
  }
  if (!input.author.trim()) {
    throw new Error("O autor do comentario e obrigatorio.");
  }
  if (!input.file.trim()) {
    throw new Error("O arquivo do comentario e obrigatorio.");
  }
  if (!Number.isInteger(input.line) || input.line < 1) {
    throw new Error("A linha do comentario deve ser maior que zero.");
  }
  const updatedAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const comments = session.comments ?? [];
  const id = input.id ?? `${session.id}-comment-${comments.length + 1}`;
  const threadId = input.threadId ?? id;
  const comment = {
    id,
    threadId,
    body: input.body.trim(),
    author: input.author,
    file: input.file,
    line: input.line,
    commit: input.commit,
    createdAt: updatedAt,
    updatedAt,
    history: []
  };
  return {
    ...session,
    comments: [...comments, comment],
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-comment-added-${session.history.length + 1}`,
        type: "COMMENT_ADDED",
        message: `Comentario adicionado em ${input.file}:${input.line}`,
        createdAt: updatedAt
      }
    ]
  };
}
function editReviewComment(session, commentId, body, editor, now = /* @__PURE__ */ new Date()) {
  if (!body.trim()) {
    throw new Error("O comentario nao pode ser vazio.");
  }
  const existingComments = session.comments ?? [];
  const comment = existingComments.find((item) => item.id === commentId);
  if (!comment) {
    throw new Error(`Comentario nao encontrado: ${commentId}`);
  }
  const updatedAt = now.toISOString();
  const comments = existingComments.map((item) => {
    if (item.id !== commentId) return item;
    return {
      ...item,
      body: body.trim(),
      updatedAt,
      history: [
        ...item.history,
        {
          body: item.body,
          editedAt: updatedAt,
          editor
        }
      ]
    };
  });
  return {
    ...session,
    comments,
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-comment-edited-${session.history.length + 1}`,
        type: "COMMENT_EDITED",
        message: `Comentario editado em ${comment.file}:${comment.line}`,
        createdAt: updatedAt
      }
    ]
  };
}
function navigateReviewSession(session, target, now = /* @__PURE__ */ new Date()) {
  if (!target.ref.trim()) {
    throw new Error("A referencia de navegacao e obrigatoria.");
  }
  const updatedAt = now.toISOString();
  return {
    ...session,
    activeNavigation: target,
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-navigation-${session.history.length + 1}`,
        type: "NAVIGATION_CHANGED",
        message: `Navegacao alterada para ${target.kind}: ${target.ref}`,
        createdAt: updatedAt
      }
    ]
  };
}
function validateFindingInput(input) {
  if (!input.rule.trim()) throw new Error("A regra violada e obrigatoria.");
  if (!input.description.trim()) throw new Error("A descricao da validacao e obrigatoria.");
  if (!input.file.trim()) throw new Error("O arquivo da validacao e obrigatorio.");
  if (!Number.isInteger(input.line) || input.line < 1) throw new Error("A linha da validacao deve ser maior que zero.");
  if (!input.commit.trim()) throw new Error("O commit da validacao e obrigatorio.");
  if (!input.responsible.trim()) throw new Error("O responsavel da validacao e obrigatorio.");
}
function findFinding(session, findingId) {
  const findings = session.findings ?? [];
  const finding = findings.find((item) => item.id === findingId);
  if (!finding) {
    throw new Error(`Validacao nao encontrada: ${findingId}`);
  }
  return { finding, findings };
}
function appendHistory(session, type, message, createdAt) {
  return [
    ...session.history,
    {
      id: `${session.id}-history-${session.history.length + 1}`,
      type,
      message,
      createdAt
    }
  ];
}
function updateReviewSessionGitContext(session, git2, now = /* @__PURE__ */ new Date()) {
  const updatedAt = now.toISOString();
  return {
    ...session,
    sourceBranch: git2.currentBranch,
    targetBranch: git2.baseBranch,
    pullRequestId: git2.pullRequestId,
    changedFiles: git2.changedFiles,
    commits: git2.commits,
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-git-${session.history.length + 1}`,
        type: "GIT_CONTEXT_REFRESHED",
        message: `Contexto Git atualizado para ${git2.currentBranch} -> ${git2.baseBranch}`,
        createdAt: updatedAt
      }
    ]
  };
}
function updateReviewSessionStatus(session, status, now = /* @__PURE__ */ new Date()) {
  if (session.status === status) {
    return session;
  }
  const updatedAt = now.toISOString();
  return {
    ...session,
    status,
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-status-${session.history.length + 1}`,
        type: "STATUS_CHANGED",
        message: `Status alterado de ${session.status} para ${status}`,
        createdAt: updatedAt
      }
    ]
  };
}

// src/application/reviewSessionService.ts
var ReviewSessionService = class {
  constructor(repository, gitService) {
    this.repository = repository;
    this.gitService = gitService;
  }
  async getDashboardState() {
    const [currentSession, git2, sessions] = await Promise.all([
      this.repository.getCurrent(),
      this.gitService.getContext(),
      this.repository.list()
    ]);
    return { currentSession, git: git2, sessions };
  }
  async startReview(author, reviewer) {
    const git2 = await this.gitService.getContext();
    const existing = await this.repository.getCurrent();
    const session = existing ? updateReviewSessionGitContext(existing, git2) : createReviewSession({ git: git2, author, reviewer });
    await this.repository.saveCurrent(session);
    return session;
  }
  async openReview(id) {
    const session = await this.repository.getById(id);
    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }
    await this.repository.saveCurrent(session);
    return session;
  }
  async updateStatus(id, status) {
    const session = await this.repository.getById(id);
    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }
    const updated = updateReviewSessionStatus(session, status);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async navigate(id, target) {
    const session = await this.getExistingSession(id);
    const updated = navigateReviewSession(session, target);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async addComment(id, input) {
    const session = await this.getExistingSession(id);
    const updated = addReviewComment(session, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async editComment(id, commentId, body, editor) {
    const session = await this.getExistingSession(id);
    const updated = editReviewComment(session, commentId, body, editor);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async createFinding(id, input) {
    const session = await this.getExistingSession(id);
    const updated = createValidationFinding(session, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async updateFindingStatus(id, findingId, status, reason) {
    const session = await this.getExistingSession(id);
    const updated = updateValidationFindingStatus(session, findingId, status, reason);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async registerCorrection(id, findingId, input) {
    const session = await this.getExistingSession(id);
    const updated = registerCorrectionAttempt(session, findingId, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async revalidate(id, findingId, input) {
    const session = await this.getExistingSession(id);
    const updated = revalidateFinding(session, findingId, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async getExistingSession(id) {
    const session = await this.repository.getById(id);
    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }
    return session;
  }
};

// src/infrastructure/gitCliService.ts
var import_node_child_process = require("node:child_process");
var import_node_util = require("node:util");
var execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);
var GitCliService = class {
  constructor(workspaceFolder) {
    this.workspaceFolder = workspaceFolder;
  }
  async getContext() {
    if (!this.workspaceFolder) {
      return emptyGitContext("sem-workspace");
    }
    const cwd = this.workspaceFolder.uri.fsPath;
    try {
      const [currentBranch, baseBranch, changedFiles, commits] = await Promise.all([
        git(cwd, ["branch", "--show-current"]),
        detectBaseBranch(cwd),
        git(cwd, ["diff", "--name-only", "HEAD"]),
        git(cwd, ["log", "--oneline", "--max-count=20"])
      ]);
      return {
        currentBranch: currentBranch.trim() || "detached-head",
        baseBranch,
        pullRequestId: detectPullRequestId(currentBranch),
        changedFiles: lines(changedFiles),
        commits: lines(commits)
      };
    } catch {
      return emptyGitContext("git-indisponivel");
    }
  }
};
async function detectBaseBranch(cwd) {
  const branches = await git(cwd, ["branch", "--format=%(refname:short)"]);
  const names = lines(branches);
  if (names.includes("main")) return "main";
  if (names.includes("master")) return "master";
  if (names.includes("develop")) return "develop";
  return names.find((name) => !name.startsWith("*")) ?? "main";
}
async function git(cwd, args) {
  const { stdout } = await execFileAsync("git", args, { cwd });
  return stdout;
}
function lines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
function detectPullRequestId(branch) {
  const match = branch.match(/(?:pr|pull|pull-request)[/-](\d+)/i);
  return match?.[1];
}
function emptyGitContext(currentBranch) {
  return {
    currentBranch,
    baseBranch: "main",
    changedFiles: [],
    commits: []
  };
}

// src/infrastructure/vscodeReviewSessionRepository.ts
var CURRENT_SESSION_KEY = "codeReview.currentSession";
var SESSIONS_KEY = "codeReview.sessions";
var VscodeReviewSessionRepository = class {
  constructor(context) {
    this.context = context;
  }
  async getCurrent() {
    return this.context.workspaceState.get(CURRENT_SESSION_KEY);
  }
  async list() {
    return this.context.workspaceState.get(SESSIONS_KEY, []);
  }
  async getById(id) {
    const sessions = await this.list();
    return sessions.find((session) => session.id === id);
  }
  async saveCurrent(session) {
    const sessions = await this.list();
    const nextSessions = [session, ...sessions.filter((item) => item.id !== session.id)];
    await this.context.workspaceState.update(CURRENT_SESSION_KEY, session);
    await this.context.workspaceState.update(SESSIONS_KEY, nextSessions);
  }
};

// src/presentation/reviewPanel.ts
var vscode = __toESM(require("vscode"));
var ReviewPanel = class {
  constructor(context, service) {
    this.context = context;
    this.service = service;
  }
  open(view) {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      this.postState();
      return;
    }
    this.panel = vscode.window.createWebviewPanel(
      "codeReviewDashboard",
      view === "dashboard" ? "Code Review Dashboard" : "Review Analysis",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "webview-ui", "dist")]
      }
    );
    this.panel.onDidDispose(() => {
      this.panel = void 0;
    });
    this.panel.webview.onDidReceiveMessage((message) => this.handleMessage(message));
    this.panel.webview.html = getWebviewHtml(this.panel.webview, this.context.extensionUri, view);
    this.postState();
  }
  async startReview() {
    if (!this.panel) {
      this.open("analysis");
    }
    const author = await getGitUserName();
    const reviewer = vscode.env.machineId;
    const session = await this.service.startReview(author, reviewer);
    this.post({ type: "reviewSessionStarted", payload: session });
    vscode.window.showInformationMessage("Review session iniciada.");
  }
  async handleMessage(message) {
    if (message.type === "requestState") {
      await this.postState();
    }
    if (message.type === "startReview") {
      await this.startReview();
    }
    if (message.type === "openReview" && typeof message.payload?.id === "string") {
      await this.service.openReview(message.payload.id);
      await this.postState();
    }
    if (message.type === "updateReviewStatus" && typeof message.payload?.id === "string" && typeof message.payload?.status === "string" && isReviewSessionStatus(message.payload.status)) {
      await this.service.updateStatus(message.payload.id, message.payload.status);
      await this.postState();
    }
    if (message.type === "navigateReview" && typeof message.payload?.id === "string" && isNavigationKind(message.payload.kind) && typeof message.payload.ref === "string") {
      await this.service.navigate(message.payload.id, {
        kind: message.payload.kind,
        ref: message.payload.ref,
        file: typeof message.payload.file === "string" ? message.payload.file : void 0,
        line: typeof message.payload.line === "number" ? message.payload.line : void 0
      });
      await this.postState();
    }
    if (message.type === "addReviewComment" && typeof message.payload?.id === "string" && typeof message.payload.body === "string" && typeof message.payload.file === "string" && typeof message.payload.line === "number") {
      await this.service.addComment(message.payload.id, {
        body: message.payload.body,
        author: vscode.env.machineId,
        file: message.payload.file,
        line: message.payload.line,
        commit: typeof message.payload.commit === "string" ? message.payload.commit : void 0,
        threadId: typeof message.payload.threadId === "string" ? message.payload.threadId : void 0
      });
      await this.postState();
    }
    if (message.type === "editReviewComment" && typeof message.payload?.id === "string" && typeof message.payload.commentId === "string" && typeof message.payload.body === "string") {
      await this.service.editComment(message.payload.id, message.payload.commentId, message.payload.body, vscode.env.machineId);
      await this.postState();
    }
    if (message.type === "createValidationFinding" && typeof message.payload?.id === "string" && typeof message.payload.rule === "string" && typeof message.payload.severity === "string" && isValidationSeverity(message.payload.severity) && typeof message.payload.description === "string" && typeof message.payload.file === "string" && typeof message.payload.line === "number" && typeof message.payload.commit === "string") {
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
    if (message.type === "updateValidationFindingStatus" && typeof message.payload?.id === "string" && typeof message.payload.findingId === "string" && typeof message.payload.status === "string" && isValidationFindingStatus(message.payload.status)) {
      await this.service.updateFindingStatus(message.payload.id, message.payload.findingId, message.payload.status);
      await this.postState();
    }
    if (message.type === "registerCorrectionAttempt" && typeof message.payload?.id === "string" && typeof message.payload.findingId === "string" && typeof message.payload.commit === "string" && typeof message.payload.description === "string") {
      await this.service.registerCorrection(message.payload.id, message.payload.findingId, {
        author: vscode.env.machineId,
        commit: message.payload.commit,
        description: message.payload.description
      });
      await this.postState();
    }
    if (message.type === "revalidateFinding" && typeof message.payload?.id === "string" && typeof message.payload.findingId === "string" && typeof message.payload.result === "string" && isValidationFindingStatus(message.payload.result) && typeof message.payload.notes === "string") {
      await this.service.revalidate(message.payload.id, message.payload.findingId, {
        reviewer: vscode.env.machineId,
        result: message.payload.result,
        notes: message.payload.notes
      });
      await this.postState();
    }
  }
  async postState() {
    const state = await this.service.getDashboardState();
    this.post({ type: "dashboardState", payload: state });
  }
  post(message) {
    this.panel?.webview.postMessage(message);
  }
};
function isNavigationKind(value) {
  return value === "commit" || value === "diff" || value === "file" || value === "comment" || value === "validation";
}
function getWebviewHtml(webview, extensionUri, initialView = "dashboard") {
  const distUri = vscode.Uri.joinPath(extensionUri, "webview-ui", "dist");
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "assets", "index.js"));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "assets", "index.css"));
  const nonce = getNonce();
  return (
    /* html */
    `<!doctype html>
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
</html>`
  );
}
async function getGitUserName() {
  const config = vscode.workspace.getConfiguration("git");
  return config.get("user.name") ?? vscode.env.machineId;
}
function getNonce() {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/presentation/reviewSidebarProvider.ts
var ReviewSidebarProvider = class {
  constructor(service) {
    this.service = service;
  }
  static {
    this.viewType = "codeReview.sidebar";
  }
  async resolveWebviewView(webviewView) {
    const state = await this.service.getDashboardState();
    const session = state.currentSession;
    webviewView.webview.options = { enableScripts: false };
    webviewView.webview.html = `<!doctype html>
<html lang="pt-BR">
<body style="font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px;">
  <h2 style="font-size: 16px;">Code Review</h2>
  <p><strong>Branch:</strong> ${escapeHtml(state.git.currentBranch)}</p>
  <p><strong>Destino:</strong> ${escapeHtml(state.git.baseBranch)}</p>
  <p><strong>Status:</strong> ${escapeHtml(session?.status ?? "sem sessao")}</p>
  <p><strong>Arquivos alterados:</strong> ${state.git.changedFiles.length}</p>
</body>
</html>`;
  }
};
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// src/extension.ts
function activate(context) {
  const workspaceFolder = vscode2.workspace.workspaceFolders?.[0];
  const repository = new VscodeReviewSessionRepository(context);
  const gitService = new GitCliService(workspaceFolder);
  const reviewSessionService = new ReviewSessionService(repository, gitService);
  const reviewPanel = new ReviewPanel(context, reviewSessionService);
  context.subscriptions.push(
    vscode2.window.registerWebviewViewProvider(ReviewSidebarProvider.viewType, new ReviewSidebarProvider(reviewSessionService)),
    vscode2.commands.registerCommand("codeReview.openDashboard", () => reviewPanel.open("dashboard")),
    vscode2.commands.registerCommand("codeReview.startReview", () => reviewPanel.startReview()),
    vscode2.commands.registerCommand("codeReview.openPullRequest", () => reviewPanel.open("dashboard"))
  );
  reviewPanel.open("dashboard");
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
