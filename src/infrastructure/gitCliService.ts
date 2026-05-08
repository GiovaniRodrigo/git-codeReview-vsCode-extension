import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import { GitContext } from '../domain/reviewSession';
import { GitService } from '../application/reviewSessionService';

const execFileAsync = promisify(execFile);

export class GitCliService implements GitService {
  constructor(private readonly workspaceFolder?: vscode.WorkspaceFolder) {}

  async getContext(): Promise<GitContext> {
    if (!this.workspaceFolder) {
      return emptyGitContext('sem-workspace');
    }

    const cwd = this.workspaceFolder.uri.fsPath;

    try {
      const [currentBranch, baseBranch, changedFiles, commits] = await Promise.all([
        git(cwd, ['branch', '--show-current']),
        detectBaseBranch(cwd),
        git(cwd, ['diff', '--name-only', 'HEAD']),
        git(cwd, ['log', '--oneline', '--max-count=20'])
      ]);

      return {
        currentBranch: currentBranch.trim() || 'detached-head',
        baseBranch,
        pullRequestId: detectPullRequestId(currentBranch),
        changedFiles: lines(changedFiles),
        commits: lines(commits)
      };
    } catch {
      return emptyGitContext('git-indisponivel');
    }
  }
}

async function detectBaseBranch(cwd: string): Promise<string> {
  const branches = await git(cwd, ['branch', '--format=%(refname:short)']);
  const names = lines(branches);

  if (names.includes('main')) return 'main';
  if (names.includes('master')) return 'master';
  if (names.includes('develop')) return 'develop';

  return names.find((name) => !name.startsWith('*')) ?? 'main';
}

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout;
}

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function detectPullRequestId(branch: string): string | undefined {
  const match = branch.match(/(?:pr|pull|pull-request)[/-](\d+)/i);
  return match?.[1];
}

function emptyGitContext(currentBranch: string): GitContext {
  return {
    currentBranch,
    baseBranch: 'main',
    changedFiles: [],
    commits: []
  };
}
