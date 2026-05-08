import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";

export class GitHubClientFactory {
  public async create(createIfNone = false): Promise<Octokit> {
    const session = await vscode.authentication.getSession("github", ["repo"], { createIfNone });
    if (!session) {
      throw new Error("Autenticacao GitHub ausente. Execute uma acao GitHub e autorize o VS Code quando solicitado.");
    }

    return new Octokit({ auth: session.accessToken });
  }
}
