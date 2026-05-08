import { GitRef } from "../git/types";

export type CodeReviewState = "open" | "closed" | "merged" | "draft";

export interface CodeReviewCheck {
  name: string;
  status: string;
  conclusion?: string;
  url?: string;
}

export interface CodeReviewSummary {
  id: string; // number or string id
  number: number;
  title: string;
  state: CodeReviewState;
  headBranch: string;
  baseBranch: string;
  headSha: string;
  url: string;
  checks?: CodeReviewCheck[];
  providerId: string;
}

export interface CodeReviewComment {
  body: string;
  path?: string;
  line?: number;
}

export interface RemoteProvider {
  readonly id: string;
  detect(rootPath: string): Promise<boolean>;
  getReviews(rootPath: string): Promise<CodeReviewSummary[]>;
  findReviewForBranch(reviews: CodeReviewSummary[], branchName: string): CodeReviewSummary | undefined;
  approve(review: CodeReviewSummary): Promise<void>;
  reject(review: CodeReviewSummary, reason: string): Promise<void>;
  comment(review: CodeReviewSummary, comment: CodeReviewComment): Promise<void>;
}
