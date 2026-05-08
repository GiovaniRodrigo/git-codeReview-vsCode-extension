import { AIProvider, AIConfig, AICache } from "./types";

export class AIService {
  private readonly defaultTimeout = 1500;

  constructor(
    private provider: AIProvider,
    private config: AIConfig,
    private cache: AICache
  ) {}

  public async summarizeCommit(hash: string, message: string, diff: string): Promise<string | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }

    const cached = this.cache.get(hash);
    if (cached) {
      return cached;
    }

    const summary = await this.withTimeout(
      this.provider.summarizeCommit(message, diff),
      this.config.timeoutMs ?? this.defaultTimeout,
      `AI Summarization timed out for commit ${hash}`
    );
    
    this.cache.set(hash, summary);
    return summary;
  }

  public async analyzeFile(hash: string, path: string, diff: string): Promise<{ suggestions: string[]; bugs: string[] } | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }

    const cacheKey = `${hash}:${path}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const analysis = await this.withTimeout(
      this.provider.analyzeFile(path, diff),
      this.config.timeoutMs ?? this.defaultTimeout,
      `AI Analysis timed out for file ${path}`
    );

    this.cache.set(cacheKey, JSON.stringify(analysis));
    return analysis;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error(message)), ms);
      promise.then(
        (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }
}

export class MockAIProvider implements AIProvider {
  public readonly name = "mock";

  public async summarizeCommit(message: string, diff: string): Promise<string> {
    return `[AI Mock] This commit "${message}" modifies ${diff.split("\n").length} lines.`;
  }

  public async analyzeFile(path: string, diff: string): Promise<{ suggestions: string[]; bugs: string[] }> {
    return {
      suggestions: [`[AI Mock] Consider adding more tests for ${path}`],
      bugs: diff.includes("FIXME") ? ["[AI Mock] Found a FIXME in the diff"] : []
    };
  }
}
