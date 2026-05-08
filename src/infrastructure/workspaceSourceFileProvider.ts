import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { SourceFile } from '../domain/architectureRules';
import { SourceFileProvider } from '../application/reviewSessionService';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

export class WorkspaceSourceFileProvider implements SourceFileProvider {
  constructor(private readonly workspaceFolder?: vscode.WorkspaceFolder) {}

  async readFiles(paths: string[]): Promise<SourceFile[]> {
    if (!this.workspaceFolder) return [];

    const limitedPaths = paths
      .filter((filePath) => SUPPORTED_EXTENSIONS.has(path.extname(filePath)))
      .slice(0, 80);

    const files = await Promise.all(limitedPaths.map((filePath) => this.readFile(filePath)));
    return files.filter((file): file is SourceFile => Boolean(file));
  }

  private async readFile(filePath: string): Promise<SourceFile | undefined> {
    try {
      const absolutePath = path.join(this.workspaceFolder!.uri.fsPath, filePath);
      const content = await fs.readFile(absolutePath, 'utf8');
      return { path: filePath, content };
    } catch {
      return undefined;
    }
  }
}
