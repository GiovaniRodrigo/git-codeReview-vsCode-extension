import { GitService } from "./gitService";
import { parseBranchList, parseTagList } from "./parsers";
import { BranchSummary, TagSummary } from "./types";

const refFormat = "%(refname:short)%1f%(upstream:short)%1f%(objectname:short)";
const tagFormat = "%(refname:short)%1f%(objectname:short)";

export class BranchService {
  public constructor(private readonly git: GitService) {}

  public async listLocalBranches(rootPath: string): Promise<BranchSummary[]> {
    const output = await this.git.run(["branch", "--format", refFormat], rootPath);
    return parseBranchList(output, "local");
  }

  public async listRemoteBranches(rootPath: string): Promise<BranchSummary[]> {
    const output = await this.git.run(["branch", "-r", "--format", refFormat], rootPath);
    return parseBranchList(output, "remote").filter((branch) => !branch.name.endsWith("/HEAD"));
  }

  public async listTags(rootPath: string): Promise<TagSummary[]> {
    const output = await this.git.run(["tag", "--format", tagFormat], rootPath);
    return parseTagList(output);
  }
}
