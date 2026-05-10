import {
  analyzeArchitectureRules,
  SourceFile,
  ArchitectureRuleFinding
} from '../domain/architectureRules';
import {
  addReviewComment,
  addCollaborationMessage,
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
  PartialApprovalScope,
  registerPartialApproval,
  updateValidationFindingStatus,
  updateReviewCommentStatus,
  ReviewCommentStatus,
  ValidationFindingStatus,
  ValidationSeverity,
  updateReviewSessionGitContext,
  updateReviewSessionStatus,
  updateMergeDecision
} from '../domain/reviewSession';
import { calculateReviewMetrics, ReviewMetrics } from '../telemetry/reviewMetrics';
import { LocalTtlCache } from './performanceCache';
import { listIntegrationDescriptors, IntegrationDescriptor } from './integrationDescriptors';
import { AssistedIntelligenceReport, buildAssistedIntelligenceReport } from './assistedIntelligence';

export interface ReviewSessionRepository {
  getCurrent(): Promise<ReviewSession | undefined>;
  getById(id: string): Promise<ReviewSession | undefined>;
  saveCurrent(session: ReviewSession): Promise<void>;
  list(): Promise<ReviewSession[]>;
  delete?(id: string): Promise<void>;
  exportDatabase?(): Promise<string>;
  createBackup?(): Promise<string>;
  syncToRemote?(targetPath?: string): Promise<string>;
}

export interface GitService {
  getContext(): Promise<GitContext>;
}

export interface SourceFileProvider {
  readFiles(paths: string[]): Promise<SourceFile[]>;
}

export interface AuditService {
  registerSessionSnapshot(session: ReviewSession): Promise<void>;
  exportData(): Promise<string>;
}

export interface PerformanceState {
  cacheEnabled: boolean;
  lazySessionLimit: number;
  incrementalBatchSize: number;
  asyncProcessingEnabled: boolean;
}

export interface DashboardState {
  currentSession?: ReviewSession;
  git: GitContext;
  sessions: ReviewSession[];
  metrics: ReviewMetrics;
  intelligence: AssistedIntelligenceReport;
  performance: PerformanceState;
  integrations: IntegrationDescriptor[];
  currentUser: string;
  vscode?: VSCodeContextState;
}

export interface VSCodeContextState {
  problems: Array<{ file: string; line: number; severity: string; message: string; source?: string }>;
  tests: { available: boolean; lastRunStatus: string; lastRunAt?: string; failed?: number };
}

export class ReviewSessionService {
  private readonly dashboardCache = new LocalTtlCache<DashboardState>(1500);

  constructor(
    private readonly repository: ReviewSessionRepository,
    private readonly gitService: GitService,
    private readonly sourceFileProvider?: SourceFileProvider,
    private readonly auditService?: AuditService
  ) {}

  async getDashboardState(user: string): Promise<DashboardState> {
    const cached = this.dashboardCache.get(`dashboard-${user}`);
    if (cached) return cached;

    const [currentSession, git, sessions] = await Promise.all([
      this.repository.getCurrent(),
      this.gitService.getContext(),
      this.repository.list()
    ]);
    const visibleSessions = sessions.slice(0, 50);
    const state: DashboardState = {
      currentSession,
      git,
      sessions: visibleSessions,
      metrics: calculateReviewMetrics(sessions),
      intelligence: buildAssistedIntelligenceReport(currentSession, sessions),
      performance: {
        cacheEnabled: true,
        lazySessionLimit: 50,
        incrementalBatchSize: 25,
        asyncProcessingEnabled: true
      },
      integrations: listIntegrationDescriptors(),
      currentUser: user
    };

    this.dashboardCache.set(`dashboard-${user}`, state);
    return state;
  }

  async startReview(author: string, reviewer: string): Promise<ReviewSession> {
    const git = await this.gitService.getContext();
    const existing = await this.repository.getCurrent();
    const session = existing
      ? updateReviewSessionGitContext(existing, git)
      : createReviewSession({ git, author, reviewer });

    await this.saveAndAudit(session);
    return session;
  }

  async openReview(id: string): Promise<ReviewSession> {
    const session = await this.repository.getById(id);

    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }

    await this.saveAndAudit(session);
    return session;
  }

  async deleteReview(id: string): Promise<void> {
    const session = await this.repository.getById(id);

    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }

    if (!this.repository.delete) {
      throw new Error('Repositorio atual nao oferece remocao permanente de review session.');
    }

    await this.repository.delete(id);
    this.dashboardCache.clear();
  }

  async updateStatus(id: string, status: ReviewSessionStatus, user: string): Promise<ReviewSession> {
    const session = await this.repository.getById(id);

    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }

    const updated = updateReviewSessionStatus(session, status, user);
    await this.saveAndAudit(updated);
    return updated;
  }

  async navigate(id: string, target: ReviewNavigationTarget): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = navigateReviewSession(session, target);
    await this.saveAndAudit(updated);
    return updated;
  }

  async addComment(
    id: string,
    input: { body: string; author: string; file: string; line: number; commit?: string; threadId?: string; severity?: ValidationSeverity; status?: ReviewCommentStatus }
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = addReviewComment(session, input);
    await this.saveAndAudit(updated);
    return updated;
  }

  async updateCommentStatus(id: string, commentId: string, status: ReviewCommentStatus, user: string): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    if (status === 'APPROVED' && !isReviewer(session, user)) {
      throw new Error('Apenas o reviewer oficial ou admin pode aprovar um comentario.');
    }
    const updated = updateReviewCommentStatus(session, commentId, status, user);
    await this.saveAndAudit(updated);
    return updated;
  }

  async editComment(id: string, commentId: string, body: string, editor: string): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = editReviewComment(session, commentId, body, editor);
    await this.saveAndAudit(updated);
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
    await this.saveAndAudit(updated);
    return updated;
  }

  async updateFindingStatus(
    id: string,
    findingId: string,
    status: ValidationFindingStatus,
    user: string,
    reason?: string
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = updateValidationFindingStatus(session, findingId, status, user, reason);
    await this.saveAndAudit(updated);
    return updated;
  }

  async registerCorrection(
    id: string,
    findingId: string,
    input: { author: string; commit: string; description: string }
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = registerCorrectionAttempt(session, findingId, input);
    await this.saveAndAudit(updated);
    return updated;
  }

  async revalidate(
    id: string,
    findingId: string,
    input: { reviewer: string; result: ValidationFindingStatus; notes: string }
  ): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = revalidateFinding(session, findingId, input);
    await this.saveAndAudit(updated);
    return updated;
  }

  async runArchitectureValidation(id: string): Promise<{ session: ReviewSession; findings: ArchitectureRuleFinding[] }> {
    const session = await this.getExistingSession(id);
    const sourceFiles = await this.sourceFileProvider?.readFiles(session.changedFiles) ?? [];
    const findings = analyzeArchitectureRules(sourceFiles);
    const commit = session.commits[0]?.split(' ')[0] ?? 'HEAD';

    const updated = findings.reduce((current, ruleFinding) => createValidationFinding(current, {
      rule: ruleFinding.rule,
      severity: ruleFinding.severity,
      description: `${ruleFinding.category}: ${ruleFinding.description}`,
      file: ruleFinding.file,
      line: ruleFinding.line,
      commit,
      responsible: current.reviewer
    }), session);

    await this.saveAndAudit(updated);
    return { session: updated, findings };
  }

  async addCollaborationMessage(id: string, input: { author: string; body: string; threadId?: string }): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = addCollaborationMessage(session, input);
    await this.saveAndAudit(updated);
    return updated;
  }

  async approvePartial(id: string, input: { scope: PartialApprovalScope; target: string; reviewer: string }): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = registerPartialApproval(session, input);
    await this.saveAndAudit(updated);
    return updated;
  }

  async refreshMergeDecision(id: string): Promise<ReviewSession> {
    const session = await this.getExistingSession(id);
    const updated = updateMergeDecision(session);
    await this.saveAndAudit(updated);
    return updated;
  }


  async exportLocalDatabase(): Promise<string> {
    return this.repository.exportDatabase?.() ?? JSON.stringify({ sessions: await this.repository.list() }, null, 2);
  }

  async createBackup(): Promise<string> {
    const result = await this.repository.createBackup?.();
    if (!result) throw new Error('Repositorio atual nao oferece backup local.');
    return result;
  }

  async syncRemote(targetPath?: string): Promise<string> {
    const result = await this.repository.syncToRemote?.(targetPath);
    if (!result) throw new Error('Repositorio atual nao oferece sincronizacao remota.');
    return result;
  }

  private async saveAndAudit(session: ReviewSession): Promise<void> {
    await this.repository.saveCurrent(session);
    this.dashboardCache.clear();
    await this.auditService?.registerSessionSnapshot(session);
  }

  async exportAuditData(): Promise<string> {
    return this.auditService?.exportData() ?? "";
  }

  private async getExistingSession(id: string): Promise<ReviewSession> {
    const session = await this.repository.getById(id);

    if (!session) {
      throw new Error(`Review session nao encontrada: ${id}`);
    }

    return session;
  }
}
