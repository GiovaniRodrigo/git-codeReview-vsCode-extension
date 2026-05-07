export type BranchType = "local" | "remote";

export interface BranchSummary {
  name: string;
  type: BranchType;
  upstream?: string;
  headCommit?: string;
}

export interface TagSummary {
  name: string;
  targetCommit?: string;
}

export interface CommitSummary {
  hash: string;
  shortHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  date: string;
}

export type CommitFileStatus = "added" | "modified" | "deleted" | "renamed" | "copied";

export interface CommitFileChange {
  path: string;
  previousPath?: string;
  status: CommitFileStatus;
  additions?: number;
  deletions?: number;
}

export interface CommitDetails extends CommitSummary {
  body?: string;
  files: CommitFileChange[];
}

export interface GitRef {
  name: string;
  kind: "branch" | "tag";
  type?: BranchType;
}
