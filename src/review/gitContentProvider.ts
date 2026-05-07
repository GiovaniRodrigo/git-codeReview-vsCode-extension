import * as vscode from "vscode";
import { GitService } from "../git/gitService";

interface GitDocumentQuery {
  rootPath: string;
  ref: string;
  path: string;
}

export const gitReviewScheme = "code-review-git";

export class GitContentProvider implements vscode.TextDocumentContentProvider {
  public constructor(private readonly git: GitService) {}

  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const query = parseQuery(uri);
    return this.git.showFileAtRef(query.rootPath, query.ref, query.path);
  }
}

export function createGitDocumentUri(rootPath: string, ref: string, filePath: string): vscode.Uri {
  return vscode.Uri.from({
    scheme: gitReviewScheme,
    authority: ref.replace(/[^\w.-]/g, "_"),
    path: `/${filePath}`,
    query: JSON.stringify({ rootPath, ref, path: filePath } satisfies GitDocumentQuery)
  });
}

function parseQuery(uri: vscode.Uri): GitDocumentQuery {
  return JSON.parse(uri.query) as GitDocumentQuery;
}
