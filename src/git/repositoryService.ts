import { parseGitTreeStatus } from "./parsers";
import { GitService } from "./gitService";
import { GitTreeInfo } from "./types";

export class RepositoryService {
  public constructor(private readonly git: GitService) {}

  public async getTreeInfo(rootPath: string): Promise<GitTreeInfo> {
    const [statusOutput, head] = await Promise.all([
      this.git.run(["status", "--short", "--branch"], rootPath),
      this.readHead(rootPath)
    ]);

    return parseGitTreeStatus(rootPath, statusOutput, head);
  }

  private async readHead(rootPath: string): Promise<string | undefined> {
    try {
      return await this.git.run(["rev-parse", "--short", "HEAD"], rootPath);
    } catch {
      return undefined;
    }
  }
}
