import * as vscode from "vscode";

export class ConfigService {
  private static readonly SECTION = "codeReview";

  public static get<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    return config.get<T>(key, defaultValue);
  }

  public static async update(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    await config.update(key, value, target);
  }

  public static getGitLabCustomDomains(): string[] {
    return this.get<string[]>("gitlab.customDomains", []);
  }

  public static async addGitLabCustomDomain(domain: string): Promise<void> {
    const domains = this.getGitLabCustomDomains();
    const normalized = domain.trim().toLowerCase();
    if (normalized && !domains.includes(normalized)) {
      await this.update("gitlab.customDomains", [...domains, normalized]);
    }
  }

  public static isTelemetryEnabled(): boolean {
    return this.get<boolean>("telemetry.enabled", false);
  }

  public static isAIEnabled(): boolean {
    return this.get<boolean>("ai.enabled", false);
  }

  public static getAIProvider(): string {
    return this.get<string>("ai.provider", "mock");
  }
}
