import * as vscode from 'vscode';
import { ReviewSession } from '../domain/reviewSession';
import { ReviewSessionRepository } from '../application/reviewSessionService';

const CURRENT_SESSION_KEY = 'codeReview.currentSession';
const SESSIONS_KEY = 'codeReview.sessions';

export class VscodeReviewSessionRepository implements ReviewSessionRepository {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async getCurrent(): Promise<ReviewSession | undefined> {
    return this.context.workspaceState.get<ReviewSession>(CURRENT_SESSION_KEY);
  }

  async list(): Promise<ReviewSession[]> {
    return this.context.workspaceState.get<ReviewSession[]>(SESSIONS_KEY, []);
  }

  async saveCurrent(session: ReviewSession): Promise<void> {
    const sessions = await this.list();
    const nextSessions = [session, ...sessions.filter((item) => item.id !== session.id)];

    await this.context.workspaceState.update(CURRENT_SESSION_KEY, session);
    await this.context.workspaceState.update(SESSIONS_KEY, nextSessions);
  }
}
