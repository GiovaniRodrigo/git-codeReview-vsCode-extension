import * as vscode from "vscode";

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function showError(error: unknown): Promise<void> {
  await vscode.window.showErrorMessage(getErrorMessage(error));
}
