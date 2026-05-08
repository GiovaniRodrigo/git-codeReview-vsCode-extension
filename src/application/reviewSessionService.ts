import {
  addReviewComment,
  createReviewSession,
  createValidationFinding,
  editReviewComment,
  GitContext,
  navigateReviewSession,
  registerCorrectionAttempt,
  revalidateFinding,
  ReviewNavigationTarget,
  ReviewSession,
  ReviewSessionStatus,
  updateValidationFindingStatus,
  ValidationFindingStatus,
  ValidationSeverity,
  updateReviewSessionGitContext,
  updateReviewSessionStatus
} from '../domain/reviewSession';

export interface ReviewSessionRepository {
  getCurrent(): Promise<ReviewSession | undefined>;
  getById(id: string): Promise<ReviewSession | undefined>;
  saveCurrent(session: ReviewSession): Promise<void>;
  list(): Promise<ReviewSession[]>;
}

export interface GitService {
  getContext(): Promise<GitContext>;
}

export class ReviewSessionService {
  constructor(
    private readonly repository: ReviewSessionRepository,
    private readonly gitService: GitService
  ) {}

  async getDashboardState(): Promise<{ currentSession?: ReviewSession; git: GitContext; sessions: ReviewSession[] }> {
    const [currentSession, git, sessions] = await Promise.all([
      this.repository.getCurrent(),
      this.gitService.getContext(),
      this.repository.list()
    ]);

    return { currentSession, git, sessions };
  }

  async startReview(author: string, reviewer: string): Promise<ReviewSession> {
    const git = await this.gitService.getContext();
    const existing = await this.repository.getCurrent();
    const session = existing
      ? updateReviewSessionGitContext(existing, git)
      : createReviewSession({ git, author, reviewer });

    await this.repository.saveCurrent(session);
    return session;
  }

  async openReview(id: string): Promise<ReviewSession> {
    const session = await this.repository.getById(id);

    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }

    await this.repository.saveCurrent(session);
    return session;
  }

  async updateStatus(id: string, status: ReviewSessionStatus): Promise<ReviewSession> {
    const session = await this.repository.getById(id);

    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }

    const updated = updateReviewSessionStatus(session, status);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  async navigate(id: string, target: ReviewNavigationTarget): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = navigateReviewSession(session, target);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  async addComment(
    id: string,
    input: { body: string; author: string; file: string; line: number; commit?: string; threadId?: string }
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = addReviewComment(session, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  async editComment(id: string, commentId: string, body: string, editor: string): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = editReviewComment(session, commentId, body, editor);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  async createFinding(
    id: string,
    input: {
      rule: string;
      severity: ValidationSeverity;
      description: string;
      file: string;
      line: number;
      commit: string;
      responsible: string;
    }
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = createValidationFinding(session, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  async updateFindingStatus(
    id: string,
    findingId: string,
    status: ValidationFindingStatus,
    reason?: string
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = updateValidationFindingStatus(session, findingId, status, reason);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  async registerCorrection(
    id: string,
    findingId: string,
    input: { author: string; commit: string; description: string }
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = registerCorrectionAttempt(session, findingId, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  async revalidate(
    id: string,
    findingId: string,
    input: { reviewer: string; result: ValidationFindingStatus; notes: string }
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = revalidateFinding(session, findingId, input);
    await this.repository.saveCurrent(updated);
    return updated;
  }

  private async getExistingSession(id: string): Promise<ReviewSession> {
    const session = await this.repository.getById(id);

    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }

    return session;
  }
}
