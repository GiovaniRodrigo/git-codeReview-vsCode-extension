export type MergeRequestState = "open" | "closed" | "merged" | "draft";

export interface MergeRequestSummary {
  number: number;
  title: string;
  state: MergeRequestState;
  headBranch: string;
  baseBranch: string;
  headSha: string;
  url: string;
  diffRefs?: {
    baseSha: string;
    headSha: string;
    startSha: string;
  };
}

export interface ReviewCommentDraft {
  body: string;
  path?: string;
  line?: number;
}
