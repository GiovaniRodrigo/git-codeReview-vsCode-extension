export type PullRequestState = "open" | "closed" | "merged" | "draft";

export interface CheckSummary {
  name: string;
  status: string;
  conclusion?: string;
  url?: string;
}

export interface PullRequestSummary {
  number: number;
  title: string;
  state: PullRequestState;
  headBranch: string;
  baseBranch: string;
  headSha: string;
  url: string;
  checks: CheckSummary[];
}

export interface ReviewCommentDraft {
  body: string;
  path?: string;
  line?: number;
}
