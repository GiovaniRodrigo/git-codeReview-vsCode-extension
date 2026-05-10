import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { ReviewSession } from '../domain/reviewSession';
import { ReviewSessionRepository } from '../application/reviewSessionService';

interface LocalReviewDatabase {
  version: 1;
  currentSessionId?: string;
  sessions: ReviewSession[];
  updatedAt: string;
}

const DATABASE_FILE = 'code-review.localdb.json';
const BACKUP_DIR = 'backups';
const LEGACY_CURRENT_SESSION_KEY = 'codeReview.currentSession';
const LEGACY_SESSIONS_KEY = 'codeReview.sessions';

export class LocalJsonReviewSessionRepository implements ReviewSessionRepository {
  private readonly databasePath: string;
  private readonly backupPath: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.databasePath = path.join(context.globalStorageUri.fsPath, DATABASE_FILE);
    this.backupPath = path.join(context.globalStorageUri.fsPath, BACKUP_DIR);
  }

  async getCurrent(): Promise<ReviewSession | undefined> {
    const database = await this.readDatabase();
    return database.sessions.find((session) => session.id === database.currentSessionId);
  }

  async list(): Promise<ReviewSession[]> {
    const database = await this.readDatabase();
    return database.sessions;
  }

  async getById(id: string): Promise<ReviewSession | undefined> {
    const database = await this.readDatabase();
    return database.sessions.find((session) => session.id === id);
  }

  async saveCurrent(session: ReviewSession): Promise<void> {
    const database = await this.readDatabase();
    const sessions = [session, ...database.sessions.filter((item) => item.id !== session.id)];
    await this.writeDatabase({
      version: 1,
      currentSessionId: session.id,
      sessions,
      updatedAt: new Date().toISOString()
    });
  }

  async delete(id: string): Promise<void> {
    const database = await this.readDatabase();
    const sessions = database.sessions.filter((session) => session.id !== id);
    await this.writeDatabase({
      version: 1,
      currentSessionId: database.currentSessionId === id ? sessions[0]?.id : database.currentSessionId,
      sessions,
      updatedAt: new Date().toISOString()
    });
  }

  async exportDatabase(): Promise<string> {
    const database = await this.readDatabase();
    return JSON.stringify(database, null, 2);
  }

  async createBackup(): Promise<string> {
    const database = await this.readDatabase();
    await fs.mkdir(this.backupPath, { recursive: true });
    const fileName = `code-review-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(this.backupPath, fileName);
    await fs.writeFile(filePath, JSON.stringify(database, null, 2), 'utf8');
    return filePath;
  }

  async syncToRemote(targetPath?: string): Promise<string> {
    const database = await this.readDatabase();
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const configuredPath = vscode.workspace.getConfiguration('codeReview').get<string>('remoteSyncPath');
    const destination = targetPath || configuredPath || (workspaceFolder ? path.join(workspaceFolder, '.code-review-sync.json') : undefined);

    if (!destination) {
      throw new Error('Nao foi possivel determinar o destino da sincronizacao remota. Configure codeReview.remoteSyncPath ou abra um workspace.');
    }

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, JSON.stringify({ syncedAt: new Date().toISOString(), database }, null, 2), 'utf8');
    return destination;
  }

  private async readDatabase(): Promise<LocalReviewDatabase> {
    await fs.mkdir(path.dirname(this.databasePath), { recursive: true });

    try {
      const raw = await fs.readFile(this.databasePath, 'utf8');
      const parsed = JSON.parse(raw) as LocalReviewDatabase;
      return {
        version: 1,
        currentSessionId: parsed.currentSessionId,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    } catch {
      const migrated = this.readLegacyState();
      await this.writeDatabase(migrated);
      return migrated;
    }
  }

  private readLegacyState(): LocalReviewDatabase {
    const currentSession = this.context.workspaceState.get<ReviewSession>(LEGACY_CURRENT_SESSION_KEY);
    const legacySessions = this.context.workspaceState.get<ReviewSession[]>(LEGACY_SESSIONS_KEY, []);
    const sessions = currentSession
      ? [currentSession, ...legacySessions.filter((session) => session.id !== currentSession.id)]
      : legacySessions;

    return {
      version: 1,
      currentSessionId: currentSession?.id ?? sessions[0]?.id,
      sessions,
      updatedAt: new Date().toISOString()
    };
  }

  private async writeDatabase(database: LocalReviewDatabase): Promise<void> {
    await fs.mkdir(path.dirname(this.databasePath), { recursive: true });
    await fs.writeFile(this.databasePath, JSON.stringify(database, null, 2), 'utf8');
  }
}
