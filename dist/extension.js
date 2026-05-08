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

// src/domain/architectureRules.ts
function analyzeArchitectureRules(files) {
  const findings = files.flatMap((file) => [
    ...solidRules(file),
    ...cleanArchitectureRules(file),
    ...dddRules(file)
  ]);
  return [...findings, ...detectCircularDependencies(files)];
}
function solidRules(file) {
  const findings = [];
  const methodCount = countMatches(file.content, /\n\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?[a-zA-Z_]\w+\s*\(/g);
  const imports = extractImports(file.content);
  if (methodCount > 12) {
    findings.push(finding(file, "SRP", "SOLID", "HIGH", "Arquivo concentra muitas responsabilidades pelo volume de metodos.", 1));
  }
  if (countMatches(file.content, /\b(case|if)\s*\([^)]*(type|kind|status|role)[^)]*\)/g) > 4) {
    findings.push(finding(file, "OCP", "SOLID", "MEDIUM", "Fluxo condicional por tipo/status sugere extensao por modificacao.", lineOf(file.content, /\b(case|if)\s*\(/)));
  }
  if (/\bextends\b/.test(file.content) && /throw new Error\(['"`](not implemented|unsupported|nao suportado)/i.test(file.content)) {
    findings.push(finding(file, "LSP", "SOLID", "HIGH", "Subclasse parece invalidar comportamento esperado com erro de nao suporte.", lineOf(file.content, /throw new Error/i)));
  }
  if (/interface\s+\w+[\s\S]*?{[\s\S]*?}/.test(file.content) && methodCount > 8) {
    findings.push(finding(file, "ISP", "SOLID", "MEDIUM", "Interface grande pode obrigar consumidores a depender de metodos desnecessarios.", lineOf(file.content, /interface\s+\w+/)));
  }
  if (/src\/(domain|application)\//.test(normalizePath(file.path)) && imports.some((item) => /infrastructure|presentation|vscode|react/.test(item))) {
    findings.push(finding(file, "DIP", "SOLID", "CRITICAL", "Camada de dominio/aplicacao depende de detalhe externo ou framework.", lineOf(file.content, /import\s+/)));
  }
  return findings;
}
function cleanArchitectureRules(file) {
  const findings = [];
  const path2 = normalizePath(file.path);
  const imports = extractImports(file.content);
  if (/src\/domain\//.test(path2) && imports.some((item) => /application|infrastructure|presentation|telemetry|vscode|react/.test(item))) {
    findings.push(finding(file, "Depend\xEAncia incorreta", "Clean Architecture", "CRITICAL", "Dominio deve permanecer independente das demais camadas.", lineOf(file.content, /import\s+/)));
  }
  if (/src\/application\//.test(path2) && imports.some((item) => /infrastructure|presentation|vscode|react/.test(item))) {
    findings.push(finding(file, "Viola\xE7\xE3o de camadas", "Clean Architecture", "HIGH", "Aplicacao deve orquestrar contratos sem depender de infraestrutura ou UI.", lineOf(file.content, /import\s+/)));
  }
  if (imports.length > 12) {
    findings.push(finding(file, "Acoplamento excessivo", "Clean Architecture", "MEDIUM", "Arquivo possui muitas dependencias diretas.", 1));
  }
  return findings;
}
function dddRules(file) {
  const findings = [];
  const path2 = normalizePath(file.path);
  if (/src\/domain\//.test(path2) && /(user|order|payment|review|validation).*(user|order|payment|review|validation)/i.test(file.content)) {
    findings.push(finding(file, "Bounded Context", "DDD", "MEDIUM", "Arquivo de dominio mistura termos de contextos distintos.", 1));
  }
  if (/(class|interface)\s+\w*Entity\b/.test(file.content) && !/\bid\b/.test(file.content)) {
    findings.push(finding(file, "Entidades", "DDD", "HIGH", "Entidade deve possuir identidade explicita.", lineOf(file.content, /(class|interface)\s+\w*Entity\b/)));
  }
  if (/(class|interface)\s+\w*ValueObject\b/.test(file.content) && /\b(set|update|mutate)\w*\s*\(/.test(file.content)) {
    findings.push(finding(file, "Value Objects", "DDD", "MEDIUM", "Value Object deve preservar imutabilidade sem mutadores.", lineOf(file.content, /\b(set|update|mutate)\w*\s*\(/)));
  }
  if (/src\/domain\/.*service/i.test(path2) && /(vscode|fetch\(|axios|infrastructure)/.test(file.content)) {
    findings.push(finding(file, "Servi\xE7os de dom\xEDnio", "DDD", "HIGH", "Servico de dominio nao deve coordenar infraestrutura ou I/O externo.", lineOf(file.content, /(vscode|fetch\(|axios|infrastructure)/)));
  }
  return findings;
}
function detectCircularDependencies(files) {
  const byPath = new Map(files.map((file) => [normalizePath(file.path), file]));
  const findings = [];
  files.forEach((file) => {
    const filePath = normalizePath(file.path);
    const imports = extractImports(file.content).map((item) => resolveImportPath(filePath, item));
    imports.forEach((importPath) => {
      const imported = byPath.get(importPath);
      if (!imported) return;
      const reverseImports = extractImports(imported.content).map((item) => resolveImportPath(importPath, item));
      if (reverseImports.includes(filePath) && filePath < importPath) {
        findings.push(finding(file, "Depend\xEAncia circular", "Clean Architecture", "HIGH", `Dependencia circular entre ${filePath} e ${importPath}.`, lineOf(file.content, /import\s+/)));
      }
    });
  });
  return findings;
}
function finding(file, rule, category, severity, description, line) {
  return { rule, category, severity, description, file: file.path, line };
}
function extractImports(content) {
  return Array.from(content.matchAll(/import\s+(?:[^'"`]+from\s+)?['"`]([^'"`]+)['"`]/g)).map((match) => match[1]);
}
function resolveImportPath(fromPath, importPath) {
  if (!importPath.startsWith(".")) return importPath;
  const parts = fromPath.split("/");
  parts.pop();
  importPath.split("/").forEach((part) => {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  });
  const resolved = parts.join("/");
  return /\.(ts|tsx|js|jsx)$/.test(resolved) ? resolved : `${resolved}.ts`;
}
function normalizePath(path2) {
  return path2.replaceAll("\\", "/");
}
function countMatches(content, pattern) {
  return Array.from(content.matchAll(pattern)).length;
}
function lineOf(content, pattern) {
  const match = pattern.exec(content);
  if (!match?.index) return 1;
  return content.slice(0, match.index).split(/\r?\n/).length;
}

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
    collaborationMessages: [],
    notifications: [],
    partialApprovals: [],
    mergeDecision: { blocked: false, reasons: [], updatedAt: now },
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
function addCollaborationMessage(session, input) {
  if (!input.author.trim()) throw new Error("O autor da mensagem e obrigatorio.");
  if (!input.body.trim()) throw new Error("A mensagem colaborativa nao pode ser vazia.");
  const createdAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const messages = session.collaborationMessages ?? [];
  const notifications = session.notifications ?? [];
  const id = input.id ?? `${session.id}-collab-${messages.length + 1}`;
  const mentions = extractMentions(input.body);
  const message = {
    id,
    threadId: input.threadId ?? id,
    author: input.author.trim(),
    body: input.body.trim(),
    mentions,
    createdAt
  };
  return {
    ...session,
    collaborationMessages: [...messages, message],
    notifications: [
      ...notifications,
      ...mentions.map((mention, index) => ({
        id: `${id}-mention-${index + 1}`,
        recipient: mention,
        message: `${message.author} mencionou voce na review ${session.sourceBranch}`,
        read: false,
        createdAt
      }))
    ],
    updatedAt: createdAt,
    history: appendHistory(session, "COLLABORATION_MESSAGE_ADDED", `Mensagem colaborativa adicionada por ${message.author}`, createdAt)
  };
}
function registerPartialApproval(session, input) {
  if (!input.target.trim()) throw new Error("O alvo da aprovacao parcial e obrigatorio.");
  if (!input.reviewer.trim()) throw new Error("O reviewer da aprovacao parcial e obrigatorio.");
  const createdAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const approvals = session.partialApprovals ?? [];
  const approval = {
    id: input.id ?? `${session.id}-approval-${approvals.length + 1}`,
    scope: input.scope,
    target: input.target.trim(),
    reviewer: input.reviewer.trim(),
    status: "APPROVED",
    createdAt
  };
  const updated = {
    ...session,
    partialApprovals: [...approvals.filter((item) => !(item.scope === approval.scope && item.target === approval.target)), approval],
    updatedAt: createdAt,
    history: appendHistory(session, "PARTIAL_APPROVAL_REGISTERED", `Aprovacao por ${approval.scope}: ${approval.target}`, createdAt)
  };
  return updateMergeDecision(updated, new Date(createdAt));
}
function updateMergeDecision(session, now = /* @__PURE__ */ new Date()) {
  const updatedAt = now.toISOString();
  const findings = session.findings ?? [];
  const reasons = [];
  const criticalOpen = findings.filter((finding2) => finding2.severity === "CRITICAL" && finding2.status !== "APPROVED");
  const highOpen = findings.filter((finding2) => finding2.severity === "HIGH" && finding2.status !== "APPROVED");
  if (criticalOpen.length) reasons.push(`${criticalOpen.length} validacao critica pendente`);
  if (highOpen.length) reasons.push(`${highOpen.length} validacao alta pendente`);
  const changedFiles = session.changedFiles ?? [];
  const approvals = session.partialApprovals ?? [];
  const unapprovedFiles = changedFiles.filter((file) => !approvals.some((approval) => approval.scope === "file" && approval.target === file && approval.status === "APPROVED"));
  if (changedFiles.length && unapprovedFiles.length) reasons.push(`${unapprovedFiles.length} arquivo(s) sem aprovacao parcial`);
  const blocked = reasons.length > 0;
  return {
    ...session,
    mergeDecision: { blocked, reasons, updatedAt },
    updatedAt,
    history: appendHistory(session, "MERGE_BLOCK_UPDATED", blocked ? "Merge bloqueado por pendencias de review" : "Merge liberado para a sessao", updatedAt)
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
  const finding2 = {
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
    findings: [...findings, finding2],
    updatedAt: createdAt,
    history: appendHistory(session, "FINDING_CREATED", `Validacao criada: ${finding2.rule} em ${finding2.file}:${finding2.line}`, createdAt)
  };
}
function updateValidationFindingStatus(session, findingId, status, reason = "", now = /* @__PURE__ */ new Date()) {
  const { finding: finding2, findings } = findFinding(session, findingId);
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
    history: appendHistory(session, "FINDING_STATUS_CHANGED", `Status da validacao ${finding2.rule} alterado para ${status}`, updatedAt)
  };
}
function registerCorrectionAttempt(session, findingId, input) {
  if (!input.author.trim()) throw new Error("O autor da correcao e obrigatorio.");
  if (!input.commit.trim()) throw new Error("O commit da correcao e obrigatorio.");
  if (!input.description.trim()) throw new Error("A descricao da correcao e obrigatoria.");
  const { finding: finding2, findings } = findFinding(session, findingId);
  const createdAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const attempt = {
    id: input.id ?? `${findingId}-correction-${finding2.correctionAttempts.length + 1}`,
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
    history: appendHistory(session, "CORRECTION_REGISTERED", `Correcao registrada para ${finding2.rule}`, createdAt)
  };
}
function revalidateFinding(session, findingId, input) {
  if (!input.reviewer.trim()) throw new Error("O reviewer da revalidacao e obrigatorio.");
  if (!input.notes.trim()) throw new Error("As notas da revalidacao sao obrigatorias.");
  const { finding: finding2, findings } = findFinding(session, findingId);
  const createdAt = (input.now ?? /* @__PURE__ */ new Date()).toISOString();
  const revalidation = {
    id: input.id ?? `${findingId}-revalidation-${finding2.revalidations.length + 1}`,
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
    history: appendHistory(session, "FINDING_REVALIDATED", `Validacao revalidada: ${finding2.rule} -> ${input.result}`, createdAt)
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
function extractMentions(body) {
  return Array.from(new Set(Array.from(body.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((match) => match[1])));
}
function findFinding(session, findingId) {
  const findings = session.findings ?? [];
  const finding2 = findings.find((item) => item.id === findingId);
  if (!finding2) {
    throw new Error(`Validacao nao encontrada: ${findingId}`);
  }
  return { finding: finding2, findings };
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

// src/telemetry/reviewMetrics.ts
function calculateReviewMetrics(sessions) {
  const findings = sessions.flatMap((session) => session.findings ?? []);
  const findingsCount = findings.length;
  const criticalCount = findings.filter((finding2) => finding2.severity === "CRITICAL").length;
  const highCount = findings.filter((finding2) => finding2.severity === "HIGH").length;
  const reopenedCount = findings.filter((finding2) => finding2.statusHistory.some((entry) => entry.status === "REOPENED")).length;
  const correctionsCount = findings.reduce((total, finding2) => total + finding2.correctionAttempts.length, 0);
  const approvalsCount = findings.filter((finding2) => finding2.status === "APPROVED").length;
  const recurrenceRate = findingsCount ? round(countRecurringRules(findings) / findingsCount * 100) : 0;
  const averageCorrectionHours = averageCorrectionTime(findings);
  const eventsCount = sessions.reduce((total, session) => total + session.history.length, 0);
  return {
    qualityScore: calculateQualityScore(findings),
    findingsCount,
    criticalCount,
    highCount,
    reopenedCount,
    recurrenceRate,
    averageCorrectionHours,
    approvalsCount,
    correctionsCount,
    eventsCount,
    ruleFrequency: frequency(findings.map((finding2) => finding2.rule)),
    reviewerCount: frequency(sessions.map((session) => session.reviewer)),
    developerCount: frequency(findings.map((finding2) => finding2.responsible)),
    timeline: buildTimeline(findings)
  };
}
function calculateQualityScore(findings) {
  const penalty = findings.reduce((total, finding2) => {
    const severityPenalty = finding2.severity === "CRITICAL" ? 22 : finding2.severity === "HIGH" ? 14 : finding2.severity === "MEDIUM" ? 7 : 3;
    const statusRelief = finding2.status === "APPROVED" ? 0.2 : finding2.status === "FIXED" ? 0.5 : 1;
    const reopenPenalty = finding2.statusHistory.filter((entry) => entry.status === "REOPENED").length * 5;
    return total + severityPenalty * statusRelief + reopenPenalty;
  }, 0);
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}
function countRecurringRules(findings) {
  const counts = /* @__PURE__ */ new Map();
  findings.forEach((finding2) => counts.set(finding2.rule, (counts.get(finding2.rule) ?? 0) + 1));
  return findings.filter((finding2) => (counts.get(finding2.rule) ?? 0) > 1).length;
}
function averageCorrectionTime(findings) {
  const durations = findings.flatMap((finding2) => {
    const createdAt = Date.parse(finding2.createdAt);
    return finding2.correctionAttempts.map((attempt) => Date.parse(attempt.createdAt) - createdAt).filter((duration) => Number.isFinite(duration) && duration >= 0);
  });
  if (!durations.length) return 0;
  const averageMs = durations.reduce((total, duration) => total + duration, 0) / durations.length;
  return round(averageMs / 1e3 / 60 / 60);
}
function frequency(values) {
  const counts = /* @__PURE__ */ new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries()).map(([rule, count]) => ({ rule, count })).sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
}
function buildTimeline(findings) {
  const byDate = /* @__PURE__ */ new Map();
  findings.forEach((finding2) => {
    const createdDate = toDateKey(finding2.createdAt);
    const createdBucket = getTimelineBucket(byDate, createdDate);
    createdBucket.findings += 1;
    finding2.correctionAttempts.forEach((attempt) => {
      getTimelineBucket(byDate, toDateKey(attempt.createdAt)).corrections += 1;
    });
    finding2.revalidations.forEach((revalidation) => {
      const bucket = getTimelineBucket(byDate, toDateKey(revalidation.createdAt));
      if (revalidation.result === "APPROVED") bucket.approvals += 1;
      if (revalidation.result === "REOPENED") bucket.reopenings += 1;
    });
  });
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
function getTimelineBucket(map, date) {
  const existing = map.get(date);
  if (existing) return existing;
  const bucket = { date, findings: 0, corrections: 0, approvals: 0, reopenings: 0 };
  map.set(date, bucket);
  return bucket;
}
function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}
function round(value) {
  return Math.round(value * 10) / 10;
}

// src/application/assistedIntelligence.ts
function buildAssistedIntelligenceReport(currentSession, sessions) {
  const findings = currentSession?.findings ?? [];
  const allFindings = sessions.flatMap((session) => session.findings ?? []);
  const recurringErrors = recurringRules(allFindings);
  const suggestions = [
    ...findings.flatMap((finding2) => suggestionsForFinding(finding2, recurringErrors)),
    ...recurringErrors.map((item, index) => ({
      id: `recurrence-${index + 1}`,
      type: "recurrence",
      title: `Erro recorrente: ${item.rule}`,
      description: `A regra ${item.rule} apareceu ${item.count} vezes no hist\xF3rico local.`,
      priority: item.count > 2 ? "HIGH" : "MEDIUM"
    }))
  ];
  const patterns = detectPatterns(allFindings);
  const comparisons = compareCurrentWithHistory(currentSession, sessions);
  const recommendations = buildRecommendations(findings, recurringErrors, patterns);
  return { suggestions, recurringErrors, patterns, comparisons, recommendations };
}
function suggestionsForFinding(finding2, recurringErrors) {
  const priority = finding2.severity;
  const recurring = recurringErrors.find((item) => item.rule === finding2.rule);
  return [
    {
      id: `${finding2.id}-correction`,
      findingId: finding2.id,
      type: "correction",
      title: `Corre\xE7\xE3o sugerida para ${finding2.rule}`,
      description: correctionText(finding2),
      priority
    },
    {
      id: `${finding2.id}-architecture`,
      findingId: finding2.id,
      type: "architecture",
      title: `Dire\xE7\xE3o arquitetural para ${finding2.rule}`,
      description: architectureText(finding2),
      priority
    },
    {
      id: `${finding2.id}-refactor`,
      findingId: finding2.id,
      type: "refactor",
      title: `Refatora\xE7\xE3o recomendada em ${finding2.file}`,
      description: `Isole a mudan\xE7a em ${finding2.file}:${finding2.line} e mantenha hist\xF3rico da corre\xE7\xE3o na valida\xE7\xE3o original.`,
      priority
    },
    {
      id: `${finding2.id}-explanation`,
      findingId: finding2.id,
      type: "explanation",
      title: `Por que ${finding2.rule} importa`,
      description: explanationText(finding2, recurring?.count ?? 0),
      priority
    }
  ];
}
function correctionText(finding2) {
  const map = {
    DIP: "Introduza uma abstra\xE7\xE3o na camada interna e mova a implementa\xE7\xE3o concreta para infraestrutura.",
    SRP: "Separe responsabilidades em casos de uso, servi\xE7os ou fun\xE7\xF5es menores com um motivo \xFAnico de mudan\xE7a.",
    OCP: "Substitua condicionais por estrat\xE9gia, polimorfismo ou registro extens\xEDvel de handlers.",
    LSP: "Garanta que subclasses preservem o contrato da base sem lan\xE7ar erro para comportamento esperado.",
    ISP: "Divida interfaces amplas em contratos menores usados por consumidores espec\xEDficos."
  };
  return map[finding2.rule] ?? "Aplique a menor altera\xE7\xE3o que remova a viola\xE7\xE3o e preserve o comportamento atual.";
}
function architectureText(finding2) {
  if (finding2.description.includes("Clean Architecture")) {
    return "Mantenha depend\xEAncias apontando para dentro: dom\xEDnio independente, aplica\xE7\xE3o orquestrando contratos e infraestrutura nos detalhes.";
  }
  if (finding2.description.includes("DDD")) {
    return "Reforce linguagem ub\xEDqua, identidade de entidades, imutabilidade de value objects e isolamento do dom\xEDnio.";
  }
  return "Prefira baixo acoplamento, alta coes\xE3o e depend\xEAncias expl\xEDcitas entre m\xF3dulos.";
}
function explanationText(finding2, recurrenceCount) {
  const recurrence = recurrenceCount > 1 ? ` Esta regra j\xE1 apareceu ${recurrenceCount} vezes no hist\xF3rico local.` : "";
  return `${finding2.rule} foi marcado como ${finding2.severity} porque impacta manuten\xE7\xE3o, rastreabilidade ou isolamento arquitetural.${recurrence}`;
}
function recurringRules(findings) {
  const counts = /* @__PURE__ */ new Map();
  findings.forEach((finding2) => counts.set(finding2.rule, (counts.get(finding2.rule) ?? 0) + 1));
  return Array.from(counts.entries()).filter(([, count]) => count > 1).map(([rule, count]) => ({ rule, count })).sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
}
function detectPatterns(findings) {
  const patterns = [];
  const criticalCount = findings.filter((finding2) => finding2.severity === "CRITICAL").length;
  const reopenedCount = findings.filter((finding2) => finding2.statusHistory.some((entry) => entry.status === "REOPENED")).length;
  if (criticalCount >= 2) patterns.push("Concentra\xE7\xE3o de viola\xE7\xF5es cr\xEDticas em revis\xF5es recentes.");
  if (reopenedCount >= 2) patterns.push("Corre\xE7\xF5es t\xEAm sido reabertas com frequ\xEAncia.");
  if (recurringRules(findings).length) patterns.push("H\xE1 regras arquiteturais recorrentes que merecem a\xE7\xE3o preventiva.");
  return patterns;
}
function compareCurrentWithHistory(currentSession, sessions) {
  if (!currentSession) return [];
  const previous = sessions.filter((session) => session.id !== currentSession.id);
  if (!previous.length) return ["Sem revis\xF5es antigas suficientes para compara\xE7\xE3o."];
  const currentFindings = currentSession.findings?.length ?? 0;
  const averagePrevious = previous.reduce((total, session) => total + (session.findings?.length ?? 0), 0) / previous.length;
  const direction = currentFindings > averagePrevious ? "acima" : "abaixo";
  return [`A sess\xE3o atual est\xE1 ${direction} da m\xE9dia hist\xF3rica de findings (${currentFindings} vs ${averagePrevious.toFixed(1)}).`];
}
function buildRecommendations(findings, recurringErrors, patterns) {
  const recommendations = [];
  if (findings.some((finding2) => finding2.severity === "CRITICAL" && finding2.status !== "APPROVED")) {
    recommendations.push("Bloqueie aprova\xE7\xE3o at\xE9 resolver findings cr\xEDticos.");
  }
  if (recurringErrors.length) {
    recommendations.push(`Priorize uma melhoria sist\xEAmica para ${recurringErrors[0].rule}.`);
  }
  if (patterns.length) {
    recommendations.push("Inclua uma checagem preventiva no fluxo de review para o padr\xE3o detectado.");
  }
  if (!recommendations.length) {
    recommendations.push("Mantenha a revis\xE3o incremental e registre decis\xF5es relevantes na timeline.");
  }
  return recommendations;
}

// src/application/reviewSessionService.ts
var ReviewSessionService = class {
  constructor(repository, gitService, sourceFileProvider) {
    this.repository = repository;
    this.gitService = gitService;
    this.sourceFileProvider = sourceFileProvider;
  }
  async getDashboardState() {
    const [currentSession, git2, sessions] = await Promise.all([
      this.repository.getCurrent(),
      this.gitService.getContext(),
      this.repository.list()
    ]);
    return {
      currentSession,
      git: git2,
      sessions,
      metrics: calculateReviewMetrics(sessions),
      intelligence: buildAssistedIntelligenceReport(currentSession, sessions)
    };
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
  async runArchitectureValidation(id) {
    const session = await this.getExistingSession(id);
    const sourceFiles = await this.sourceFileProvider?.readFiles(session.changedFiles) ?? [];
    const findings = analyzeArchitectureRules(sourceFiles);
    const commit = session.commits[0]?.split(" ")[0] ?? "HEAD";
    const updated = findings.reduce((current, ruleFinding) => createValidationFinding(current, {
      rule: ruleFinding.rule,
      severity: ruleFinding.severity,
      description: `${ruleFinding.category}: ${ruleFinding.description}`,
      file: ruleFinding.file,
      line: ruleFinding.line,
      commit,
      responsible: current.author
    }), session);
    await this.repository.saveCurrent(updated);
    return { session: updated, findings };
  }
  async addCollaborationMessage(id, input) {
    const session = await this.getExistingSession(id);
    const updated = addCollaborationMessage(session, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async approvePartial(id, input) {
    const session = await this.getExistingSession(id);
    const updated = registerPartialApproval(session, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }
  async refreshMergeDecision(id) {
    const session = await this.getExistingSession(id);
    const updated = updateMergeDecision(session);
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

// src/infrastructure/workspaceSourceFileProvider.ts
var import_node_fs = require("node:fs");
var path = __toESM(require("node:path"));
var SUPPORTED_EXTENSIONS = /* @__PURE__ */ new Set([".ts", ".tsx", ".js", ".jsx"]);
var WorkspaceSourceFileProvider = class {
  constructor(workspaceFolder) {
    this.workspaceFolder = workspaceFolder;
  }
  async readFiles(paths) {
    if (!this.workspaceFolder) return [];
    const limitedPaths = paths.filter((filePath) => SUPPORTED_EXTENSIONS.has(path.extname(filePath))).slice(0, 80);
    const files = await Promise.all(limitedPaths.map((filePath) => this.readFile(filePath)));
    return files.filter((file) => Boolean(file));
  }
  async readFile(filePath) {
    try {
      const absolutePath = path.join(this.workspaceFolder.uri.fsPath, filePath);
      const content = await import_node_fs.promises.readFile(absolutePath, "utf8");
      return { path: filePath, content };
    } catch {
      return void 0;
    }
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
    if (message.type === "runArchitectureValidation" && typeof message.payload?.id === "string") {
      const result = await this.service.runArchitectureValidation(message.payload.id);
      this.post({ type: "architectureValidationCompleted", payload: { count: result.findings.length } });
      await this.postState();
    }
    if (message.type === "addCollaborationMessage" && typeof message.payload?.id === "string" && typeof message.payload.body === "string") {
      await this.service.addCollaborationMessage(message.payload.id, {
        author: vscode.env.machineId,
        body: message.payload.body,
        threadId: typeof message.payload.threadId === "string" ? message.payload.threadId : void 0
      });
      await this.postState();
    }
    if (message.type === "approvePartial" && typeof message.payload?.id === "string" && (message.payload.scope === "module" || message.payload.scope === "file") && typeof message.payload.target === "string") {
      await this.service.approvePartial(message.payload.id, {
        scope: message.payload.scope,
        target: message.payload.target,
        reviewer: vscode.env.machineId
      });
      await this.postState();
    }
    if (message.type === "refreshMergeDecision" && typeof message.payload?.id === "string") {
      await this.service.refreshMergeDecision(message.payload.id);
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
  const sourceFileProvider = new WorkspaceSourceFileProvider(workspaceFolder);
  const reviewSessionService = new ReviewSessionService(repository, gitService, sourceFileProvider);
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
