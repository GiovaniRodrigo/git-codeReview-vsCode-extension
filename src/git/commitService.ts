import { GitService } from "./gitService";
import { parseCommitFiles, parseCommitLog } from "./parsers";
import { CommitDetails, CommitFileChange, CommitSummary } from "./types";

const logFormat = "%H%x1f%h%x1f%s%x1f%an%x1f%ae%x1f%aI";
const detailsFormat = "%H%x1f%h%x1f%s%x1f%an%x1f%ae%x1f%aI%x1f%b";

export class CommitService {
  public constructor(private readonly git: GitService) {}

  public async listCommits(rootPath: string, ref: string, limit = 50): Promise<CommitSummary[]> {
    const output = await this.git.run(["log", ref, `--max-count=${limit}`, `--format=${logFormat}`], rootPath);
    return parseCommitLog(output);
  }

  public async getCommitDetails(rootPath: string, hash: string): Promise<CommitDetails> {
    const [metadataOutput, files] = await Promise.all([
      this.git.run(["show", "--no-patch", `--format=${detailsFormat}`, hash], rootPath),
      this.listChangedFiles(rootPath, hash)
    ]);
    const [summary] = parseCommitLog(metadataOutput);

    return {
      ...summary,
      body: metadataOutput.split("\u001f").slice(6).join("\u001f").trim() || undefined,
      files
    };
  }

  public async listChangedFiles(rootPath: string, hash: string): Promise<CommitFileChange[]> {
    const [nameStatusOutput, numstatOutput] = await Promise.all([
      this.git.run(["show", "--format=", "--name-status", "-M", "-C", hash], rootPath),
      this.git.run(["show", "--format=", "--numstat", "-M", "-C", hash], rootPath)
    ]);

    return parseCommitFiles(nameStatusOutput, numstatOutput);
  }
}
