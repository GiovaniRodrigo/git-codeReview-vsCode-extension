import { CommitDetails, GitRef } from "../git/types";

export interface ReviewFileModel {
  path: string;
  previousPath?: string;
  status: string;
  additions: number;
  deletions: number;
}

export interface ReviewCommitModel {
  refName: string;
  hash: string;
  shortHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  date: string;
  body?: string;
  files: ReviewFileModel[];
  additions: number;
  deletions: number;
}

export interface ReviewModel {
  rootPath: string;
  ref: GitRef;
  commits: ReviewCommitModel[];
  refs: string[];
  authors: string[];
  files: string[];
  totals: {
    commits: number;
    files: number;
    additions: number;
    deletions: number;
  };
}

export function buildReviewModel(rootPath: string, ref: GitRef, commits: CommitDetails[]): ReviewModel {
  const reviewCommits = commits.map((commit) => toReviewCommit(ref.name, commit));
  const fileSet = new Set<string>();
  const authorSet = new Set<string>();

  for (const commit of reviewCommits) {
    authorSet.add(commit.authorName);
    for (const file of commit.files) {
      fileSet.add(file.path);
    }
  }

  return {
    rootPath,
    ref,
    commits: reviewCommits,
    refs: [ref.name],
    authors: [...authorSet].sort((a, b) => a.localeCompare(b)),
    files: [...fileSet].sort((a, b) => a.localeCompare(b)),
    totals: {
      commits: reviewCommits.length,
      files: fileSet.size,
      additions: sum(reviewCommits, "additions"),
      deletions: sum(reviewCommits, "deletions")
    }
  };
}

function toReviewCommit(refName: string, commit: CommitDetails): ReviewCommitModel {
  const files = commit.files.map((file) => ({
    path: file.path,
    previousPath: file.previousPath,
    status: file.status,
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0
  }));

  return {
    refName,
    hash: commit.hash,
    shortHash: commit.shortHash,
    message: commit.message,
    authorName: commit.authorName,
    authorEmail: commit.authorEmail,
    date: commit.date,
    body: commit.body,
    files,
    additions: files.reduce((total, file) => total + file.additions, 0),
    deletions: files.reduce((total, file) => total + file.deletions, 0)
  };
}

function sum(commits: ReviewCommitModel[], key: "additions" | "deletions"): number {
  return commits.reduce((total, commit) => total + commit[key], 0);
}
