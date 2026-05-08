import { GitLabRemote } from "../git/types";
import { GitLabClientFactory } from "./gitlabClient";
import { MergeRequestState, MergeRequestSummary, ReviewCommentDraft } from "./types";

interface GitLabMergeRequestResponse {
  iid: number;
  title: string;
  state: string;
  draft?: boolean;
  work_in_progress?: boolean;
  source_branch: string;
  target_branch: string;
  sha?: string;
  web_url: string;
  diff_refs?: {
    base_sha: string;
    head_sha: string;
    start_sha: string;
  };
}

export class MergeRequestService {
  public constructor(private readonly clientFactory: GitLabClientFactory) {}

  public async listMergeRequests(remote: GitLabRemote): Promise<MergeRequestSummary[]> {
    const project = encodeURIComponent(remote.projectPath);
    const url = `${remote.apiBaseUrl}/projects/${project}/merge_requests?state=all&order_by=updated_at&sort=desc&per_page=100`;
    const data = await this.clientFactory.request<GitLabMergeRequestResponse[]>(url);

    return data.map((mr) => ({
      number: mr.iid,
      title: mr.title,
      state: normalizeMergeRequestState(mr),
      headBranch: mr.source_branch,
      baseBranch: mr.target_branch,
      headSha: mr.sha ?? "",
      url: mr.web_url,
      diffRefs: mr.diff_refs ? {
        baseSha: mr.diff_refs.base_sha,
        headSha: mr.diff_refs.head_sha,
        startSha: mr.diff_refs.start_sha
      } : undefined
    }));
  }

  public findForBranch(mergeRequests: MergeRequestSummary[], branchName: string): MergeRequestSummary | undefined {
    const shortName = branchName.replace(/^origin\//, "");
    return mergeRequests.find((mr) => mr.headBranch === shortName || mr.headBranch === branchName);
  }

  public async submitReview(remote: GitLabRemote, mergeRequestIid: number, event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT", body: string): Promise<void> {
    const project = encodeURIComponent(remote.projectPath);

    if (event === "APPROVE") {
      const url = `${remote.apiBaseUrl}/projects/${project}/merge_requests/${mergeRequestIid}/approve`;
      await this.clientFactory.request(url, "POST");
    } else if (event === "REQUEST_CHANGES") {
      const url = `${remote.apiBaseUrl}/projects/${project}/merge_requests/${mergeRequestIid}/unapprove`;
      await this.clientFactory.request(url, "POST");
    }

    if (body.trim()) {
      await this.createNote(remote, mergeRequestIid, body);
    }
  }

  public async createNote(remote: GitLabRemote, mergeRequestIid: number, body: string): Promise<void> {
    const project = encodeURIComponent(remote.projectPath);
    const url = `${remote.apiBaseUrl}/projects/${project}/merge_requests/${mergeRequestIid}/notes`;
    await this.clientFactory.request(url, "POST", { body });
  }

  public async createReviewComment(remote: GitLabRemote, mergeRequest: MergeRequestSummary, comment: ReviewCommentDraft): Promise<void> {
    if (!comment.path || !comment.line || !mergeRequest.diffRefs) {
      await this.createNote(remote, mergeRequest.number, comment.body);
      return;
    }

    const project = encodeURIComponent(remote.projectPath);
    const url = `${remote.apiBaseUrl}/projects/${project}/merge_requests/${mergeRequest.number}/discussions`;

    const body = {
      body: comment.body,
      position: {
        base_sha: mergeRequest.diffRefs.baseSha,
        start_sha: mergeRequest.diffRefs.startSha,
        head_sha: mergeRequest.diffRefs.headSha,
        position_type: "text",
        new_path: comment.path,
        new_line: comment.line
      }
    };

    await this.clientFactory.request(url, "POST", body);
  }
}

function normalizeMergeRequestState(mr: GitLabMergeRequestResponse): MergeRequestState {
  if (mr.draft || mr.work_in_progress || /^(draft|wip):/i.test(mr.title)) {
    return "draft";
  }
  if (mr.state === "merged") {
    return "merged";
  }
  if (mr.state === "closed") {
    return "closed";
  }
  return "open";
}
