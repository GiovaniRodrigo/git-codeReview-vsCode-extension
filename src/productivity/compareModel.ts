import { CommitFileChange } from "../git/types";

export interface CompareFileModel {
  path: string;
  previousPath?: string;
  status: CommitFileChange["status"];
  additions: number;
  deletions: number;
}

export interface CompareModel {
  rootPath: string;
  base: string;
  head: string;
  files: CompareFileModel[];
  totals: {
    files: number;
    additions: number;
    deletions: number;
  };
}

export function buildCompareModel(rootPath: string, base: string, head: string, files: CommitFileChange[]): CompareModel {
  const compareFiles = files.map((file) => ({
    path: file.path,
    previousPath: file.previousPath,
    status: file.status,
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0
  })).sort(compareFilesByImpact);

  return {
    rootPath,
    base,
    head,
    files: compareFiles,
    totals: {
      files: compareFiles.length,
      additions: compareFiles.reduce((total, file) => total + file.additions, 0),
      deletions: compareFiles.reduce((total, file) => total + file.deletions, 0)
    }
  };
}

function compareFilesByImpact(left: CompareFileModel, right: CompareFileModel): number {
  return (right.additions + right.deletions) - (left.additions + left.deletions) || left.path.localeCompare(right.path);
}
