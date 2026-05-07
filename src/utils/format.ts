import { CommitFileChange } from "../git/types";

export function formatCommitDate(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleString();
}

export function formatFileStats(file: CommitFileChange): string {
  const additions = file.additions ?? 0;
  const deletions = file.deletions ?? 0;
  return `+${additions} -${deletions}`;
}

export function formatFileStatus(status: CommitFileChange["status"]): string {
  switch (status) {
    case "added":
      return "A";
    case "deleted":
      return "D";
    case "renamed":
      return "R";
    case "copied":
      return "C";
    case "modified":
    default:
      return "M";
  }
}
