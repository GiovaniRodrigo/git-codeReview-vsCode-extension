import { GitService } from "../git/gitService";
import { GitHubRemote } from "../git/types";

export class GitHubRemoteService {
  public constructor(private readonly git: GitService) {}

  public async detect(rootPath: string): Promise<GitHubRemote | undefined> {
    const output = await this.git.run(["remote", "-v"], rootPath);
    const remotes = parseGitHubRemotes(output);
    return remotes[0];
  }
}

export function parseGitHubRemotes(output: string): GitHubRemote[] {
  const remotes: GitHubRemote[] = [];

  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const [remoteName, rest] = line.split(/\s+/, 2);
    const match = rest?.match(/(?:github\.com[:/])([^/\s]+)\/([^/\s)]+?)(?:\.git)?(?:\s|$|\))/i);
    if (!remoteName || !rest || !match) {
      continue;
    }

    remotes.push({
      owner: match[1],
      repo: match[2],
      remoteName,
      url: rest.replace(/\s+\((fetch|push)\)$/, "")
    });
  }

  return uniqueRemotes(remotes);
}

function uniqueRemotes(remotes: GitHubRemote[]): GitHubRemote[] {
  const seen = new Set<string>();
  return remotes.filter((remote) => {
    const key = `${remote.remoteName}:${remote.owner}/${remote.repo}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
