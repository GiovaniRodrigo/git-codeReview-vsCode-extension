export const REVIEW_SESSION_STATUSES = [
  'OPEN',
  'IN_REVIEW',
  'NEEDS_CHANGES',
  'FIXED',
  'APPROVED',
  'REOPENED'
] as const;

export type ReviewSessionStatus = (typeof REVIEW_SESSION_STATUSES)[number];

export const VALIDATION_FINDING_STATUSES = ['NEEDS_CHANGES', 'FIXED', 'APPROVED', 'REOPENED'] as const;
export const VALIDATION_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const REVIEW_COMMENT_STATUSES = ['OPEN', 'NEEDS_CHANGES', 'RESOLVED', 'APPROVED'] as const;

export type ValidationFindingStatus = (typeof VALIDATION_FINDING_STATUSES)[number];
export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];
export type ReviewCommentStatus = (typeof REVIEW_COMMENT_STATUSES)[number];

export interface ReviewHistoryEntry {
  id: string;
  type:
    | 'SESSION_CREATED'
    | 'STATUS_CHANGED'
    | 'GIT_CONTEXT_REFRESHED'
    | 'NAVIGATION_CHANGED'
    | 'COMMENT_ADDED'
    | 'COMMENT_EDITED'
    | 'COMMENT_STATUS_CHANGED'
    | 'FINDING_CREATED'
    | 'FINDING_STATUS_CHANGED'
    | 'CORRECTION_REGISTERED'
    | 'FINDING_REVALIDATED'
    | 'COLLABORATION_MESSAGE_ADDED'
    | 'PARTIAL_APPROVAL_REGISTERED'
    | 'MERGE_BLOCK_UPDATED';
  message: string;
  createdAt: string;
}

export type ReviewNavigationKind = 'commit' | 'diff' | 'file' | 'comment' | 'validation';

export interface ReviewNavigationTarget {
  kind: ReviewNavigationKind;
  ref: string;
  file?: string;
  line?: number;
}

export interface ReviewCommentVersion {
  body: string;
  editedAt: string;
  editor: string;
}

export interface ReviewComment {
  id: string;
  threadId: string;
  body: string;
  author: string;
  file: string;
  line: number;
  commit?: string;
  severity: ValidationSeverity;
  status: ReviewCommentStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  history: ReviewCommentVersion[];
}

export interface ValidationFinding {
  id: string;
  rule: string;
  severity: ValidationSeverity;
  status: ValidationFindingStatus;
  description: string;
  file: string;
  line: number;
  commit: string;
  responsible: string;
  createdAt: string;
  updatedAt: string;
  comments: string[];
  statusHistory: Array<{ status: ValidationFindingStatus; changedAt: string; reason?: string }>;
  correctionAttempts: CorrectionAttempt[];
  revalidations: Revalidation[];
}

export interface CorrectionAttempt {
  id: string;
  author: string;
  commit: string;
  description: string;
  createdAt: string;
}

export interface Revalidation {
  id: string;
  reviewer: string;
  result: ValidationFindingStatus;
  notes: string;
  createdAt: string;
}

export interface CollaborationMessage {
  id: string;
  threadId: string;
  author: string;
  body: string;
  mentions: string[];
  createdAt: string;
}

export interface CollaborationNotification {
  id: string;
  recipient: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type PartialApprovalScope = 'module' | 'file';

export interface PartialApproval {
  id: string;
  scope: PartialApprovalScope;
  target: string;
  reviewer: string;
  status: 'APPROVED' | 'REVOKED';
  createdAt: string;
}

export interface MergeDecision {
  blocked: boolean;
  reasons: string[];
  updatedAt: string;
}

export interface GitContext {
  currentBranch: string;
  baseBranch: string;
  pullRequestId?: string;
  changedFiles: string[];
  commits: string[];
}

export interface ReviewSession {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  reviewer: string;
  status: ReviewSessionStatus;
  createdAt: string;
  updatedAt: string;
  pullRequestId?: string;
  changedFiles: string[];
  commits: string[];
  activeNavigation?: ReviewNavigationTarget;
  comments: ReviewComment[];
  findings: ValidationFinding[];
  collaborationMessages: CollaborationMessage[];
  notifications: CollaborationNotification[];
  partialApprovals: PartialApproval[];
  mergeDecision: MergeDecision;
  history: ReviewHistoryEntry[];
}

export interface CreateReviewSessionInput {
  git: GitContext;
  author: string;
  reviewer: string;
  now?: Date;
  id?: string;
}

export function isReviewSessionStatus(value: string): value is ReviewSessionStatus {
  return REVIEW_SESSION_STATUSES.includes(value as ReviewSessionStatus);
}

export function isReviewCommentStatus(value: string): value is ReviewCommentStatus {
  return REVIEW_COMMENT_STATUSES.includes(value as ReviewCommentStatus);
}

export function isReviewer(session: ReviewSession, user: string): boolean {
  return session.reviewer === user || user === 'admin';
}

export function isAuthor(session: ReviewSession, user: string): boolean {
  return session.author === user || user === 'admin';
}

export function createReviewSession(input: CreateReviewSessionInput): ReviewSession {
  if (!input.git.currentBranch) {
    throw new Error('A branch origem e obrigatoria para criar uma review session.');
  }

  if (!input.git.baseBranch) {
    throw new Error('A branch destino e obrigatoria para criar uma review session.');
  }

  if (!input.author) {
    throw new Error('O autor e obrigatorio para criar uma review session.');
  }

  if (!input.reviewer) {
    throw new Error('O reviewer e obrigatorio para criar uma review session.');
  }

  const now = (input.now ?? new Date()).toISOString();
  const id = input.id ?? `review-${Date.now()}`;

  return {
    id,
    sourceBranch: input.git.currentBranch,
    targetBranch: input.git.baseBranch,
    author: input.author,
    reviewer: input.reviewer,
    status: 'OPEN',
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
        type: 'SESSION_CREATED',
        message: `Review criada para ${input.git.currentBranch} -> ${input.git.baseBranch}`,
        createdAt: now
      }
    ]
  };
}

export function addCollaborationMessage(
  session: ReviewSession,
  input: { author: string; body: string; threadId?: string; now?: Date; id?: string }
): ReviewSession {
  if (!input.author.trim()) throw new Error('O autor da mensagem e obrigatorio.');
  if (!input.body.trim()) throw new Error('A mensagem colaborativa nao pode ser vazia.');

  const createdAt = (input.now ?? new Date()).toISOString();
  const messages = session.collaborationMessages ?? [];
  const notifications = session.notifications ?? [];
  const id = input.id ?? `${session.id}-collab-${messages.length + 1}`;
  const mentions = extractMentions(input.body);
  const message: CollaborationMessage = {
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
    history: appendHistory(session, 'COLLABORATION_MESSAGE_ADDED', `Mensagem colaborativa adicionada por ${message.author}`, createdAt)
  };
}

export function registerPartialApproval(
  session: ReviewSession,
  input: { scope: PartialApprovalScope; target: string; reviewer: string; now?: Date; id?: string }
): ReviewSession {
  if (!input.target.trim()) throw new Error('O alvo da aprovacao parcial e obrigatorio.');
  if (!input.reviewer.trim()) throw new Error('O reviewer da aprovacao parcial e obrigatorio.');
  if (!isReviewer(session, input.reviewer)) throw new Error('Apenas o reviewer oficial ou admin pode realizar aprovacoes parciais.');

  const createdAt = (input.now ?? new Date()).toISOString();
  const approvals = session.partialApprovals ?? [];
  const approval: PartialApproval = {
    id: input.id ?? `${session.id}-approval-${approvals.length + 1}`,
    scope: input.scope,
    target: input.target.trim(),
    reviewer: input.reviewer.trim(),
    status: 'APPROVED',
    createdAt
  };
  const updated = {
    ...session,
    partialApprovals: [...approvals.filter((item) => !(item.scope === approval.scope && item.target === approval.target)), approval],
    updatedAt: createdAt,
    history: appendHistory(session, 'PARTIAL_APPROVAL_REGISTERED', `Aprovacao por ${approval.scope}: ${approval.target} realizada por ${input.reviewer}`, createdAt)
  };

  return updateMergeDecision(updated, new Date(createdAt));
}

export function updateMergeDecision(session: ReviewSession, now = new Date()): ReviewSession {
  const updatedAt = now.toISOString();
  const findings = session.findings ?? [];
  const reasons: string[] = [];

  const criticalOpen = findings.filter((finding) => finding.severity === 'CRITICAL' && finding.status !== 'APPROVED');
  const highOpen = findings.filter((finding) => finding.severity === 'HIGH' && finding.status !== 'APPROVED');

  if (criticalOpen.length) reasons.push(`${criticalOpen.length} validacao critica pendente`);
  if (highOpen.length) reasons.push(`${highOpen.length} validacao alta pendente`);

  const changedFiles = session.changedFiles ?? [];
  const approvals = session.partialApprovals ?? [];
  const unapprovedFiles = changedFiles.filter((file) => !approvals.some((approval) => approval.scope === 'file' && approval.target === file && approval.status === 'APPROVED'));

  if (changedFiles.length && unapprovedFiles.length) reasons.push(`${unapprovedFiles.length} arquivo(s) sem aprovacao parcial`);

  const blocked = reasons.length > 0;

  return {
    ...session,
    mergeDecision: { blocked, reasons, updatedAt },
    updatedAt,
    history: appendHistory(session, 'MERGE_BLOCK_UPDATED', blocked ? 'Merge bloqueado por pendencias de review' : 'Merge liberado para a sessao', updatedAt)
  };
}

export interface CreateValidationFindingInput {
  rule: string;
  severity: ValidationSeverity;
  description: string;
  file: string;
  line: number;
  commit: string;
  responsible: string;
  now?: Date;
  id?: string;
}

export function isValidationFindingStatus(value: string): value is ValidationFindingStatus {
  return VALIDATION_FINDING_STATUSES.includes(value as ValidationFindingStatus);
}

export function isValidationSeverity(value: string): value is ValidationSeverity {
  return VALIDATION_SEVERITIES.includes(value as ValidationSeverity);
}

export function createValidationFinding(session: ReviewSession, input: CreateValidationFindingInput): ReviewSession {
  validateFindingInput(input);
  if (!isReviewer(session, input.responsible)) throw new Error('Apenas o reviewer oficial ou admin pode registrar novos findings.');

  const findings = session.findings ?? [];
  const createdAt = (input.now ?? new Date()).toISOString();
  const id = input.id ?? `${session.id}-finding-${findings.length + 1}`;
  const finding: ValidationFinding = {
    id,
    rule: input.rule.trim(),
    severity: input.severity,
    status: 'NEEDS_CHANGES',
    description: input.description.trim(),
    file: input.file.trim(),
    line: input.line,
    commit: input.commit.trim(),
    responsible: input.responsible.trim(),
    createdAt,
    updatedAt: createdAt,
    comments: [],
    statusHistory: [{ status: 'NEEDS_CHANGES', changedAt: createdAt }],
    correctionAttempts: [],
    revalidations: []
  };

  return {
    ...session,
    findings: [...findings, finding],
    updatedAt: createdAt,
    history: appendHistory(session, 'FINDING_CREATED', `Validacao criada por ${input.responsible}: ${finding.rule} em ${finding.file}:${finding.line}`, createdAt)
  };
}

export function updateValidationFindingStatus(
  session: ReviewSession,
  findingId: string,
  status: ValidationFindingStatus,
  user: string,
  reason = '',
  now = new Date()
): ReviewSession {
  const { finding, findings } = findFinding(session, findingId);
  const updatedAt = now.toISOString();

  if (status === 'APPROVED' && !isReviewer(session, user)) {
    throw new Error('Apenas o reviewer oficial ou admin pode aprovar um finding.');
  }

  return {
    ...session,
    findings: findings.map((item) => item.id === findingId ? {
      ...item,
      status,
      updatedAt,
      statusHistory: [...item.statusHistory, { status, changedAt: updatedAt, reason: reason || undefined }]
    } : item),
    updatedAt,
    history: appendHistory(session, 'FINDING_STATUS_CHANGED', `Status da validacao ${finding.rule} alterado para ${status} por ${user}`, updatedAt)
  };
}

export function registerCorrectionAttempt(
  session: ReviewSession,
  findingId: string,
  input: { author: string; commit: string; description: string; now?: Date; id?: string }
): ReviewSession {
  if (!input.author.trim()) throw new Error('O autor da correcao e obrigatorio.');
  if (!input.commit.trim()) throw new Error('O commit da correcao e obrigatorio.');
  if (!input.description.trim()) throw new Error('A descricao da correcao e obrigatoria.');
  if (!isAuthor(session, input.author)) throw new Error('Apenas o autor (dev) ou admin pode registrar tentativas de correcao.');

  const { finding, findings } = findFinding(session, findingId);
  const createdAt = (input.now ?? new Date()).toISOString();
  const attempt: CorrectionAttempt = {
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
      status: 'FIXED',
      updatedAt: createdAt,
      correctionAttempts: [...item.correctionAttempts, attempt],
      statusHistory: [...item.statusHistory, { status: 'FIXED', changedAt: createdAt, reason: 'Correcao registrada' }]
    } : item),
    updatedAt: createdAt,
    history: appendHistory(session, 'CORRECTION_REGISTERED', `Correcao registrada por ${input.author} para ${finding.rule}`, createdAt)
  };
}

export function revalidateFinding(
  session: ReviewSession,
  findingId: string,
  input: { reviewer: string; result: ValidationFindingStatus; notes: string; now?: Date; id?: string }
): ReviewSession {
  if (!input.reviewer.trim()) throw new Error('O reviewer da revalidacao e obrigatorio.');
  if (!input.notes.trim()) throw new Error('As notas da revalidacao sao obrigatorias.');
  if (!isReviewer(session, input.reviewer)) throw new Error('Apenas o reviewer oficial ou admin pode realizar revalidacoes.');

  const { finding, findings } = findFinding(session, findingId);
  const createdAt = (input.now ?? new Date()).toISOString();
  const revalidation: Revalidation = {
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
      statusHistory: [...item.statusHistory, { status: input.result, changedAt: createdAt, reason: 'Revalidacao' }]
    } : item),
    updatedAt: createdAt,
    history: appendHistory(session, 'FINDING_REVALIDATED', `Validacao revalidada por ${input.reviewer}: ${finding.rule} -> ${input.result}`, createdAt)
  };
}

export interface AddReviewCommentInput {
  body: string;
  author: string;
  file: string;
  line: number;
  commit?: string;
  threadId?: string;
  severity?: ValidationSeverity;
  status?: ReviewCommentStatus;
  now?: Date;
  id?: string;
}

export function addReviewComment(session: ReviewSession, input: AddReviewCommentInput): ReviewSession {
  if (!input.body.trim()) {
    throw new Error('O comentario nao pode ser vazio.');
  }

  if (!input.author.trim()) {
    throw new Error('O autor do comentario e obrigatorio.');
  }

  if (!input.file.trim()) {
    throw new Error('O arquivo do comentario e obrigatorio.');
  }

  if (!Number.isInteger(input.line) || input.line < 1) {
    throw new Error('A linha do comentario deve ser maior que zero.');
  }

  const updatedAt = (input.now ?? new Date()).toISOString();
  const comments = session.comments ?? [];
  const id = input.id ?? `${session.id}-comment-${comments.length + 1}`;
  const threadId = input.threadId ?? id;
  const comment: ReviewComment = {
    id,
    threadId,
    body: input.body.trim(),
    author: input.author,
    file: input.file,
    line: input.line,
    commit: input.commit,
    severity: input.severity ?? 'MEDIUM',
    status: input.status ?? 'NEEDS_CHANGES',
    isPublic: true,
    createdAt: updatedAt,
    updatedAt,
    history: []
  };

  return recalculateReviewSessionByComments({
    ...session,
    comments: [...comments, comment],
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-comment-added-${session.history.length + 1}`,
        type: 'COMMENT_ADDED',
        message: `Comentario adicionado em ${input.file}:${input.line}`,
        createdAt: updatedAt
      }
    ]
  });
}

export function updateReviewCommentStatus(
  session: ReviewSession,
  commentId: string,
  status: ReviewCommentStatus,
  user: string,
  now = new Date()
): ReviewSession {
  const comments = session.comments ?? [];
  const existing = comments.find((item) => item.id === commentId);

  if (!existing) {
    throw new Error(`Comentario nao encontrado: ${commentId}`);
  }

  if (status === 'APPROVED' && !isReviewer(session, user)) {
    throw new Error('Apenas o reviewer oficial ou admin pode aprovar um comentario.');
  }

  const updatedAt = now.toISOString();

  return recalculateReviewSessionByComments({
    ...session,
    comments: comments.map((item) => item.id === commentId ? { ...item, status, updatedAt } : item),
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-comment-status-${session.history.length + 1}`,
        type: 'COMMENT_STATUS_CHANGED',
        message: `Status do comentario alterado em ${existing.file}:${existing.line} para ${status} por ${user}`,
        createdAt: updatedAt
      }
    ]
  });
}

export function editReviewComment(
  session: ReviewSession,
  commentId: string,
  body: string,
  editor: string,
  now = new Date()
): ReviewSession {
  if (!body.trim()) {
    throw new Error('O comentario nao pode ser vazio.');
  }

  const existingComments = session.comments ?? [];
  const comment = existingComments.find((item) => item.id === commentId);

  if (!comment) {
    throw new Error(`Comentario nao encontrado: ${commentId}`);
  }

  if (comment.author !== editor && editor !== 'admin') {
    throw new Error('Apenas o autor original ou admin pode editar este comentario.');
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
        type: 'COMMENT_EDITED',
        message: `Comentario editado em ${comment.file}:${comment.line}`,
        createdAt: updatedAt
      }
    ]
  };
}

export function navigateReviewSession(
  session: ReviewSession,
  target: ReviewNavigationTarget,
  now = new Date()
): ReviewSession {
  if (!target.ref.trim()) {
    throw new Error('A referencia de navegacao e obrigatoria.');
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
        type: 'NAVIGATION_CHANGED',
        message: `Navegacao alterada para ${target.kind}: ${target.ref}`,
        createdAt: updatedAt
      }
    ]
  };
}

function validateFindingInput(input: CreateValidationFindingInput): void {
  if (!input.rule.trim()) throw new Error('A regra violada e obrigatoria.');
  if (!input.description.trim()) throw new Error('A descricao da validacao e obrigatoria.');
  if (!input.file.trim()) throw new Error('O arquivo da validacao e obrigatorio.');
  if (!Number.isInteger(input.line) || input.line < 1) throw new Error('A linha da validacao deve ser maior que zero.');
  if (!input.commit.trim()) throw new Error('O commit da validacao e obrigatorio.');
  if (!input.responsible.trim()) throw new Error('O responsavel da validacao e obrigatorio.');
}

function extractMentions(body: string): string[] {
  return Array.from(new Set(Array.from(body.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((match) => match[1])));
}

function findFinding(session: ReviewSession, findingId: string): { finding: ValidationFinding; findings: ValidationFinding[] } {
  const findings = session.findings ?? [];
  const finding = findings.find((item) => item.id === findingId);

  if (!finding) {
    throw new Error(`Validacao nao encontrada: ${findingId}`);
  }

  return { finding, findings };
}

function appendHistory(
  session: ReviewSession,
  type: ReviewHistoryEntry['type'],
  message: string,
  createdAt: string
): ReviewHistoryEntry[] {
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


export function recalculateReviewSessionByComments(session: ReviewSession): ReviewSession {
  const comments = session.comments ?? [];
  const openComments = comments.filter((comment) => comment.status !== 'RESOLVED' && comment.status !== 'APPROVED');
  const hasCritical = openComments.some((comment) => comment.severity === 'CRITICAL');
  const hasBlocking = openComments.some((comment) => comment.severity === 'HIGH' || comment.status === 'NEEDS_CHANGES');

  const nextStatus: ReviewSessionStatus = openComments.length === 0
    ? 'APPROVED'
    : hasCritical
      ? 'REOPENED'
      : hasBlocking
        ? 'NEEDS_CHANGES'
        : 'IN_REVIEW';

  return {
    ...session,
    status: nextStatus
  };
}

export function updateReviewSessionGitContext(
  session: ReviewSession,
  git: GitContext,
  now = new Date()
): ReviewSession {
  const updatedAt = now.toISOString();

  return {
    ...session,
    sourceBranch: git.currentBranch,
    targetBranch: git.baseBranch,
    pullRequestId: git.pullRequestId,
    changedFiles: git.changedFiles,
    commits: git.commits,
    updatedAt,
    history: [
      ...session.history,
      {
        id: `${session.id}-git-${session.history.length + 1}`,
        type: 'GIT_CONTEXT_REFRESHED',
        message: `Contexto Git atualizado para ${git.currentBranch} -> ${git.baseBranch}`,
        createdAt: updatedAt
      }
    ]
  };
}

export function updateReviewSessionStatus(
  session: ReviewSession,
  status: ReviewSessionStatus,
  user: string,
  now = new Date()
): ReviewSession {
  if (session.status === status) {
    return session;
  }

  if (status === 'APPROVED' && !isReviewer(session, user)) {
    throw new Error('Apenas o reviewer oficial ou admin pode aprovar a review session.');
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
        type: 'STATUS_CHANGED',
        message: `Status alterado de ${session.status} para ${status} por ${user}`,
        createdAt: updatedAt
      }
    ]
  };
}
