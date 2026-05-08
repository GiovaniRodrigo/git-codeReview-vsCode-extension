import { CommitDetails, GitRef } from "../git/types";
import { reviewedFileId } from "../productivity/reviewIds";

export interface ReviewFileModel {
  path: string;
  previousPath?: string;
  status: string;
  additions: number;
  deletions: number;
  category: ReviewFileCategory;
  risk: ReviewRiskLevel;
  riskScore: number;
  reviewReason: string;
  reviewed: boolean;
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
  risk: ReviewRiskLevel;
  riskScore: number;
  reviewReason: string;
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
    highRiskFiles: number;
    reviewedFiles: number;
    unreviewedFiles: number;
  };
}

export type ReviewFileCategory = "source" | "test" | "config" | "docs" | "dependency" | "asset" | "other";
export type ReviewRiskLevel = "low" | "medium" | "high";

export function buildReviewModel(rootPath: string, ref: GitRef, commits: CommitDetails[], reviewedFiles = new Set<string>()): ReviewModel {
  const reviewCommits = commits.map((commit) => toReviewCommit(ref.name, commit, reviewedFiles));
  const fileSet = new Set<string>();
  const authorSet = new Set<string>();
  let reviewedFileCount = 0;

  for (const commit of reviewCommits) {
    authorSet.add(commit.authorName);
    for (const file of commit.files) {
      fileSet.add(file.path);
      if (file.reviewed) {
        reviewedFileCount += 1;
      }
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
      deletions: sum(reviewCommits, "deletions"),
      highRiskFiles: reviewCommits.reduce((total, commit) => total + commit.files.filter((file) => file.risk === "high").length, 0),
      reviewedFiles: reviewedFileCount,
      unreviewedFiles: reviewCommits.reduce((total, commit) => total + commit.files.length, 0) - reviewedFileCount
    }
  };
}

function toReviewCommit(refName: string, commit: CommitDetails, reviewedFiles: Set<string>): ReviewCommitModel {
  const files = commit.files.map((file) => enrichReviewFile({
    hash: commit.hash,
    path: file.path,
    previousPath: file.previousPath,
    status: file.status,
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
    reviewed: reviewedFiles.has(reviewedFileId(commit.hash, file.path))
  }));
  const orderedFiles = [...files].sort(compareReviewFiles);
  const riskScore = files.reduce((highest, file) => Math.max(highest, file.riskScore), 0);

  return {
    refName,
    hash: commit.hash,
    shortHash: commit.shortHash,
    message: commit.message,
    authorName: commit.authorName,
    authorEmail: commit.authorEmail,
    date: commit.date,
    body: commit.body,
    files: orderedFiles,
    additions: files.reduce((total, file) => total + file.additions, 0),
    deletions: files.reduce((total, file) => total + file.deletions, 0),
    risk: riskLevel(riskScore),
    riskScore,
    reviewReason: commitReviewReason(orderedFiles)
  };
}

function sum(commits: ReviewCommitModel[], key: "additions" | "deletions"): number {
  return commits.reduce((total, commit) => total + commit[key], 0);
}

function enrichReviewFile(file: Omit<ReviewFileModel, "category" | "risk" | "riskScore" | "reviewReason"> & { hash: string }): ReviewFileModel {
  const category = categorizeFile(file.path);
  const churn = file.additions + file.deletions;
  let riskScore = Math.min(100, Math.floor(churn / 4));
  const reasons: string[] = [];

  if (churn >= 400) {
    riskScore += 35;
    reasons.push("large change");
  } else if (churn >= 120) {
    riskScore += 20;
    reasons.push("medium-sized change");
  }

  if (file.status === "deleted") {
    riskScore += 25;
    reasons.push("deleted file");
  } else if (file.status === "renamed" || file.status === "copied") {
    riskScore += 15;
    reasons.push(file.status === "renamed" ? "renamed file" : "copied file");
  } else if (file.status === "added") {
    riskScore += 8;
    reasons.push("new file");
  }

  if (category === "dependency") {
    riskScore += 30;
    reasons.push("dependency or lockfile");
  } else if (category === "config") {
    riskScore += 20;
    reasons.push("configuration");
  } else if (category === "source") {
    riskScore += 10;
    reasons.push("runtime source");
  } else if (category === "test" || category === "docs") {
    riskScore -= 10;
  }

  const cappedScore = Math.max(0, Math.min(100, riskScore));

  return {
    path: file.path,
    previousPath: file.previousPath,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    reviewed: file.reviewed,
    category,
    riskScore: cappedScore,
    risk: riskLevel(cappedScore),
    reviewReason: reasons.length > 0 ? reasons.join(", ") : "small isolated change"
  };
}

function compareReviewFiles(left: ReviewFileModel, right: ReviewFileModel): number {
  return right.riskScore - left.riskScore || left.path.localeCompare(right.path);
}

function categorizeFile(path: string): ReviewFileCategory {
  const normalized = path.toLowerCase();
  const basename = normalized.split("/").pop() ?? normalized;

  if (/\.(md|mdx|rst|txt|adoc)$/.test(normalized) || normalized.startsWith("docs/")) {
    return "docs";
  }
  if (/(^|\/)(__tests__|tests?|spec)\//.test(normalized) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(normalized)) {
    return "test";
  }
  if (
    basename.endsWith("lock") ||
    ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "composer.lock", "go.sum", "cargo.lock"].includes(basename)
  ) {
    return "dependency";
  }
  if (
    [".env", ".gitignore", ".vscodeignore", "dockerfile", "makefile", "tsconfig.json", "webpack.config.js", "vite.config.ts"].includes(basename) ||
    /\.(ya?ml|toml|ini|jsonc)$/.test(normalized) ||
    normalized.startsWith(".github/")
  ) {
    return "config";
  }
  if (/\.(png|jpe?g|gif|svg|webp|ico|mp4|mov|pdf|woff2?)$/.test(normalized)) {
    return "asset";
  }
  if (/\.[cm]?[jt]sx?$|\.py$|\.go$|\.rs$|\.java$|\.kt$|\.cs$|\.php$|\.rb$/.test(normalized)) {
    return "source";
  }
  return "other";
}

function riskLevel(score: number): ReviewRiskLevel {
  if (score >= 70) {
    return "high";
  }
  if (score >= 35) {
    return "medium";
  }
  return "low";
}

function commitReviewReason(files: ReviewFileModel[]): string {
  const highestRisk = files[0];
  if (!highestRisk) {
    return "no changed files";
  }

  const highRiskCount = files.filter((file) => file.risk === "high").length;
  if (highRiskCount > 1) {
    return `${highRiskCount} high-risk files`;
  }
  return highestRisk.reviewReason;
}
