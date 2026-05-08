import { GitService } from "../git/gitService";
import { GitLabRemote } from "../git/types";

export class GitLabRemoteService {
  public constructor(private readonly git: GitService) {}

  public async detect(rootPath: string, customDomains: string[] = []): Promise<GitLabRemote | undefined> {
    const output = await this.git.run(["remote", "-v"], rootPath);
    return parseGitLabRemotes(output, customDomains)[0];
  }
}

export function parseGitLabRemotes(output: string, customDomains: string[] = []): GitLabRemote[] {
  const remotes: GitLabRemote[] = [];

  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const [remoteName, rest] = line.split(/\s+/, 2);
    if (!remoteName || !rest) {
      continue;
    }

    const remote = parseGitLabRemote(remoteName, rest.replace(/\s+\((fetch|push)\)$/, ""), customDomains);
    if (remote) {
      remotes.push(remote);
    }
  }

  return uniqueRemotes(remotes);
}

function parseGitLabRemote(remoteName: string, url: string, customDomains: string[] = []): GitLabRemote | undefined {
  // Matches:
  // https://gitlab.com/owner/repo.git
  // git@gitlab.com:owner/repo.git
  // ssh://git@gitlab.com/owner/repo.git
  const match = url.match(/(?:https?:\/\/|git@|ssh:\/\/git@)([^/:]+)(?::|\/)(.+?)(?:\.git)?$/i);
  if (!match) {
    return undefined;
  }

  const host = match[1];
  const isGitLab = host.toLowerCase().includes("gitlab") || customDomains.some((domain) => host.toLowerCase() === domain.toLowerCase());

  if (!isGitLab) {
    return undefined;
  }

  const projectPath = match[2].replace(/^\/+/, "").replace(/\.git$/i, "");
  const parts = projectPath.split("/");
  const repo = parts[parts.length - 1];
  const owner = parts.slice(0, -1).join("/");

  if (!owner || !repo) {
    return undefined;
  }

  return {
    host,
    projectPath,
    owner,
    repo,
    remoteName,
    url,
    webUrl: `https://${host}/${projectPath}`,
    apiBaseUrl: `https://${host}/api/v4`
  };
}

function uniqueRemotes(remotes: GitLabRemote[]): GitLabRemote[] {
  const seen = new Set<string>();
  return remotes.filter((remote) => {
    const key = `${remote.remoteName}:${remote.host}/${remote.projectPath}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
