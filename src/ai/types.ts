export interface AIProvider {
  name: string;
  summarizeCommit(message: string, diff: string): Promise<string>;
  analyzeFile(path: string, diff: string): Promise<{ suggestions: string[]; bugs: string[] }>;
}

export interface AIConfig {
  enabled: boolean;
  provider: string;
  timeoutMs?: number;
}

export interface AICache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}
