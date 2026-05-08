import { createReviewSession, GitContext, ReviewSession, updateReviewSessionGitContext } from '../domain/reviewSession';

export interface ReviewSessionRepository {
  getCurrent(): Promise<ReviewSession | undefined>;
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
}
