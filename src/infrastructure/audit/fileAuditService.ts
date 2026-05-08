import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { ReviewSession } from '../../domain/reviewSession';

export interface AuditEntry {
  id: string;
  action: string;
  sessionId: string;
  actor: string;
  timestamp: string;
  previousHash: string;
  immutableHash: string;
  payloadHash: string;
}

export class FileAuditService {
  private readonly auditFilePath: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.auditFilePath = path.join(context.globalStorageUri.fsPath, 'audit-log.ndjson');
  }

  async registerSessionSnapshot(session: ReviewSession): Promise<void> {
    await fs.mkdir(path.dirname(this.auditFilePath), { recursive: true });

    const latestHistory = session.history.at(-1);
    const previousHash = await this.getLastHash();
    const timestamp = new Date().toISOString();
    const payloadHash = sha256(JSON.stringify(session));
    const unsignedEntry = {
      id: `${session.id}-${Date.now()}`,
      action: latestHistory?.type ?? 'SESSION_UPDATED',
      sessionId: session.id,
      actor: session.reviewer,
      timestamp,
      previousHash,
      payloadHash
    };
    const entry: AuditEntry = {
      ...unsignedEntry,
      immutableHash: sha256(JSON.stringify(unsignedEntry))
    };

    await fs.appendFile(this.auditFilePath, `${JSON.stringify(entry)}\n`, 'utf8');
  }

  async exportData(): Promise<string> {
    try {
      return await fs.readFile(this.auditFilePath, 'utf8');
    } catch {
      return '';
    }
  }

  private async getLastHash(): Promise<string> {
    try {
      const raw = await fs.readFile(this.auditFilePath, 'utf8');
      const lastLine = raw.split(/\r?\n/).filter(Boolean).at(-1);
      if (!lastLine) return 'GENESIS';
      const entry = JSON.parse(lastLine) as AuditEntry;
      return entry.immutableHash || 'GENESIS';
    } catch {
      return 'GENESIS';
    }
  }
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
