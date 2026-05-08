export const REVIEW_SESSION_STATUSES = [
  'OPEN',
  'IN_REVIEW',
  'NEEDS_CHANGES',
  'FIXED',
  'APPROVED',
  'REOPENED'
] as const;

export type ReviewSessionStatus = (typeof REVIEW_SESSION_STATUSES)[number];

export interface ReviewHistoryEntry {
  id: string;
  type: 'SESSION_CREATED' | 'STATUS_CHANGED' | 'GIT_CONTEXT_REFRESHED' | 'NAVIGATION_CHANGED' | 'COMMENT_ADDED' | 'COMMENT_EDITED';
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
  createdAt: string;
  updatedAt: string;
  history: ReviewCommentVersion[];
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

export interface AddReviewCommentInput {
  body: string;
  author: string;
  file: string;
  line: number;
  commit?: string;
  threadId?: string;
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
        type: 'COMMENT_ADDED',
        message: `Comentario adicionado em ${input.file}:${input.line}`,
        createdAt: updatedAt
      }
    ]
  };
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
  now = new Date()
): ReviewSession {
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
        type: 'STATUS_CHANGED',
        message: `Status alterado de ${session.status} para ${status}`,
        createdAt: updatedAt
      }
    ]
  };
}
