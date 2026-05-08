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
  type: 'SESSION_CREATED' | 'STATUS_CHANGED' | 'GIT_CONTEXT_REFRESHED';
  message: string;
  createdAt: string;
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
  history: ReviewHistoryEntry[];
}

export interface CreateReviewSessionInput {
  git: GitContext;
  author: string;
  reviewer: string;
  now?: Date;
  id?: string;
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
