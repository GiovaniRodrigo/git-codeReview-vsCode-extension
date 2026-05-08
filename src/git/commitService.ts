import { GitService } from "./gitService";
import { parseCommitFiles, parseCommitLog } from "./parsers";
import { CommitDetails, CommitFileChange, CommitSummary } from "./types";
import { TimedCache } from "../utils/cache";

const logFormat = "%H%x1f%h%x1f%s%x1f%an%x1f%ae%x1f%aI";
const detailsFormat = "%H%x1f%h%x1f%s%x1f%an%x1f%ae%x1f%aI%x1f%b";

export class CommitService {
  private readonly commitCache = new TimedCache<CommitSummary[]>(60_000);
  private readonly fileCache = new TimedCache<CommitFileChange[]>(120_000);
  private readonly detailsCache = new TimedCache<CommitDetails>(120_000);

  public constructor(private readonly git: GitService) {}

  public async listCommits(rootPath: string, ref: string, limit = 50): Promise<CommitSummary[]> {
    const key = `${rootPath}:${ref}:${limit}`;
    const cached = this.commitCache.get(key);
    if (cached) {
      return cached;
    }

    const output = await this.git.run(["log", ref, `--max-count=${limit}`, `--format=${logFormat}`], rootPath);
    const commits = parseCommitLog(output);
    this.commitCache.set(key, commits);
    return commits;
  }

  public async getCommitDetails(rootPath: string, hash: string): Promise<CommitDetails> {
    const key = `${rootPath}:${hash}`;
    const cached = this.detailsCache.get(key);
    if (cached) {
      return cached;
    }

    const [metadataOutput, files] = await Promise.all([
      this.git.run(["show", "--no-patch", `--format=${detailsFormat}`, hash], rootPath),
      this.listChangedFiles(rootPath, hash)
    ]);
    const [summary] = parseCommitLog(metadataOutput);

    const details = {
      ...summary,
      body: metadataOutput.split("\u001f").slice(6).join("\u001f").trim() || undefined,
      files
    };
    this.detailsCache.set(key, details);
    return details;
  }

  public async listChangedFiles(rootPath: string, hash: string): Promise<CommitFileChange[]> {
    const key = `${rootPath}:${hash}`;
    const cached = this.fileCache.get(key);
    if (cached) {
      return cached;
    }

    const [nameStatusOutput, numstatOutput] = await Promise.all([
      this.git.run(["show", "--format=", "--name-status", "-M", "-C", hash], rootPath),
      this.git.run(["show", "--format=", "--numstat", "-M", "-C", hash], rootPath)
    ]);

    const files = parseCommitFiles(nameStatusOutput, numstatOutput);
    this.fileCache.set(key, files);
    return files;
  }

  public async getCommitDiff(rootPath: string, hash: string): Promise<string> {
    return this.git.run(["show", "--format=", "--patch", hash], rootPath);
  }

  public async getFileDiff(rootPath: string, hash: string, path: string): Promise<string> {
    return this.git.run(["show", "--format=", "--patch", hash, "--", path], rootPath);
  }

  public clearCache(): void {
    this.commitCache.clear();
    this.fileCache.clear();
    this.detailsCache.clear();
  }
}
