import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";

const execFileAsync = promisify(execFile);

export class GitService {
  public async getRepositoryRoot(): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error("Abra uma pasta do VS Code antes de usar o Code Review.");
    }

    try {
      return await this.run(["rev-parse", "--show-toplevel"], workspaceFolder.uri.fsPath);
    } catch {
      throw new Error("A pasta aberta nao parece ser um repositorio Git.");
    }
  }

  public async run(args: string[], cwd: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", args, {
        cwd,
        maxBuffer: 1024 * 1024 * 20
      });

      return stdout.trimEnd();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao executar git ${args.join(" ")}: ${message}`);
    }
  }

  public async showFileAtRef(rootPath: string, ref: string, filePath: string): Promise<string> {
    try {
      return await this.run(["show", `${ref}:${filePath}`], rootPath);
    } catch {
      return "";
    }
  }
}
