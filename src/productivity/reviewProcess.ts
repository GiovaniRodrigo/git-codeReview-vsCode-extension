import * as crypto from "node:crypto";
import * as vscode from "vscode";
import { CommitSummary, GitRef } from "../git/types";

const reviewProcessesKey = "codeReview.reviewProcesses";

export type ReviewProcessStatus = "active" | "completed";
export type ReviewProcessTargetKind = "branch" | "tag" | "commit";

export interface ReviewProcess {
  id: string;
  rootPath: string;
  name: string;
  targetKind: ReviewProcessTargetKind;
  ref: GitRef;
  commitHash?: string;
  commitShortHash?: string;
  status: ReviewProcessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewProcessInput {
  rootPath: string;
  name?: string;
  ref: GitRef;
  commit?: CommitSummary;
  now?: Date;
}

export class ReviewProcessStore {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public list(rootPath: string): ReviewProcess[] {
    return this.read()
      .filter((process) => process.rootPath === rootPath)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public get(id: string): ReviewProcess | undefined {
    return this.read().find((process) => process.id === id);
  }

  public async create(input: ReviewProcessInput): Promise<ReviewProcess> {
    const processes = this.read();
    const process = createReviewProcess(input);
    await this.write([process, ...processes]);
    return process;
  }

  public async touch(id: string, now = new Date()): Promise<ReviewProcess | undefined> {
    const processes = this.read();
    const process = processes.find((item) => item.id === id);
    if (!process) {
      return undefined;
    }

    process.updatedAt = now.toISOString();
    await this.write(processes);
    return process;
  }

  public async complete(id: string, now = new Date()): Promise<ReviewProcess | undefined> {
    const processes = this.read();
    const process = processes.find((item) => item.id === id);
    if (!process) {
      return undefined;
    }

    process.status = "completed";
    process.updatedAt = now.toISOString();
    await this.write(processes);
    return process;
  }

  private read(): ReviewProcess[] {
    return this.context.workspaceState.get<ReviewProcess[]>(reviewProcessesKey, []);
  }

  private async write(processes: ReviewProcess[]): Promise<void> {
    await this.context.workspaceState.update(reviewProcessesKey, processes);
  }
}

export function createReviewProcess(input: ReviewProcessInput): ReviewProcess {
  const now = (input.now ?? new Date()).toISOString();
  const targetKind = input.commit ? "commit" : input.ref.kind;

  return {
    id: crypto.randomUUID(),
    rootPath: input.rootPath,
    name: input.name?.trim() || defaultReviewProcessName(input.ref, input.commit),
    targetKind,
    ref: input.ref,
    commitHash: input.commit?.hash,
    commitShortHash: input.commit?.shortHash,
    status: "active",
    createdAt: now,
    updatedAt: now
  };
}

export function reviewProcessDescription(process: ReviewProcess): string {
  const target = process.targetKind === "commit"
    ? `${process.ref.name} @ ${process.commitShortHash ?? process.commitHash ?? "commit"}`
    : process.ref.name;
  return `${process.status} - ${target}`;
}

function defaultReviewProcessName(ref: GitRef, commit?: CommitSummary): string {
  if (commit) {
    return `Review ${ref.name} @ ${commit.shortHash}`;
  }
  return `Review ${ref.name}`;
}
