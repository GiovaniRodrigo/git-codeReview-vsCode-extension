export function reviewedFileId(hash: string, path: string): string {
  return `${hash}:${path}`;
}
