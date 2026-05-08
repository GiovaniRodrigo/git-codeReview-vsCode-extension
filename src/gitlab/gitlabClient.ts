import * as vscode from "vscode";

const tokenKey = "codeReview.gitlab.token";

export class GitLabClientFactory {
  public constructor(private readonly secrets: vscode.SecretStorage) {}

  public async setToken(token: string): Promise<void> {
    await this.secrets.store(tokenKey, token);
  }

  public async getToken(): Promise<string | undefined> {
    return this.secrets.get(tokenKey);
  }

  public async request<T>(url: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: any): Promise<T> {
    const token = await this.getToken();
    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...(token ? { "PRIVATE-TOKEN": token } : {}),
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`GitLab API failed: HTTP ${response.status} ${response.statusText}. ${errorBody}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("fetch failed")) {
          throw new Error(`GitLab connection failed. Check if the URL is accessible and SSL is valid: ${url}`);
        }
        throw error;
      }
      throw new Error(String(error));
    }
  }
}
