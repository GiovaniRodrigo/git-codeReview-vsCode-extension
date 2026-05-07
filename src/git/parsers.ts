import { BranchSummary, CommitFileChange, CommitFileStatus, CommitSummary, TagSummary } from "./types";

const fieldSeparator = "\u001f";

export function parseBranchList(output: string, type: BranchSummary["type"]): BranchSummary[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, upstream, headCommit] = line.split(fieldSeparator);
      return {
        name: normalizeBranchName(name, type),
        type,
        upstream: upstream || undefined,
        headCommit: headCommit || undefined
      };
    });
}

export function parseTagList(output: string): TagSummary[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, targetCommit] = line.split(fieldSeparator);
      return { name, targetCommit: targetCommit || undefined };
    });
}

export function parseCommitLog(output: string): CommitSummary[] {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [hash, shortHash, message, authorName, authorEmail, date] = line.split(fieldSeparator);
      return {
        hash,
        shortHash,
        message,
        authorName,
        authorEmail: authorEmail || undefined,
        date
      };
    });
}

export function parseCommitFiles(nameStatusOutput: string, numstatOutput: string): CommitFileChange[] {
  const statsByPath = parseNumstat(numstatOutput);

  return nameStatusOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const rawStatus = parts[0] ?? "";
      const status = normalizeFileStatus(rawStatus);
      const previousPath = status === "renamed" || status === "copied" ? parts[1] : undefined;
      const path = status === "renamed" || status === "copied" ? parts[2] : parts[1];
      const stats = statsByPath.get(path) ?? (previousPath ? statsByPath.get(previousPath) : undefined);

      return {
        path,
        previousPath,
        status,
        additions: stats?.additions,
        deletions: stats?.deletions
      };
    });
}

function normalizeBranchName(name: string, type: BranchSummary["type"]): string {
  if (type === "remote") {
    return name.replace(/^refs\/remotes\//, "");
  }

  return name.replace(/^refs\/heads\//, "");
}

function normalizeFileStatus(rawStatus: string): CommitFileStatus {
  const code = rawStatus.charAt(0);

  switch (code) {
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "M":
    default:
      return "modified";
  }
}

function parseNumstat(output: string): Map<string, { additions: number; deletions: number }> {
  const stats = new Map<string, { additions: number; deletions: number }>();

  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const [additions, deletions, ...pathParts] = line.split("\t");
    const path = pathParts.join("\t");
    stats.set(normalizeNumstatPath(path), {
      additions: parseStatNumber(additions),
      deletions: parseStatNumber(deletions)
    });
  }

  return stats;
}

function parseStatNumber(value: string): number {
  return value === "-" ? 0 : Number.parseInt(value, 10);
}

function normalizeNumstatPath(path: string): string {
  const renameMatch = path.match(/^(.*)\{(.+) => (.+)\}(.*)$/);
  if (!renameMatch) {
    return path;
  }

  const [, prefix, , next, suffix] = renameMatch;
  return `${prefix}${next}${suffix}`;
}
