import test from "node:test";
import assert from "node:assert/strict";
import { AIConfig, AICache } from "../src/ai/types";
import { AIService, MockAIProvider } from "../src/ai/aiService";

class MockCache implements AICache {
  private data = new Map<string, string>();
  get(key: string): string | undefined { return this.data.get(key); }
  set(key: string, value: string): void { this.data.set(key, value); }
}

test("AIService summarizes commit when enabled", async () => {
  const provider = new MockAIProvider();
  const config: AIConfig = { enabled: true, provider: "mock" };
  const cache = new MockCache();
  const service = new AIService(provider, config, cache);

  const summary = await service.summarizeCommit("abc", "feat: test", "diff content");
  assert.match(summary || "", /\[AI Mock\]/);
});

test("AIService returns undefined when disabled", async () => {
  const provider = new MockAIProvider();
  const config: AIConfig = { enabled: false, provider: "mock" };
  const cache = new MockCache();
  const service = new AIService(provider, config, cache);

  const summary = await service.summarizeCommit("abc", "feat: test", "diff content");
  assert.equal(summary, undefined);
});

test("AIService returns cached summary if available", async () => {
  const provider = new MockAIProvider();
  const config: AIConfig = { enabled: true, provider: "mock" };
  const cache = new MockCache();
  cache.set("abc", "Cached summary");
  const service = new AIService(provider, config, cache);

  const summary = await service.summarizeCommit("abc", "feat: test", "diff content");
  assert.equal(summary, "Cached summary");
});

test("AIService analyzes file and returns suggestions", async () => {
  const provider = new MockAIProvider();
  const config: AIConfig = { enabled: true, provider: "mock" };
  const cache = new MockCache();
  const service = new AIService(provider, config, cache);

  const analysis = await service.analyzeFile("abc", "src/test.ts", "diff content");
  assert.ok(analysis);
  assert.ok(analysis.suggestions.length > 0);
  assert.match(analysis.suggestions[0], /\[AI Mock\]/);
});

test("AIService times out if provider takes too long", async () => {
  class SlowProvider extends MockAIProvider {
    async summarizeCommit(): Promise<string> {
      await new Promise(resolve => setTimeout(resolve, 50));
      return "late summary";
    }
  }
  
  const provider = new SlowProvider();
  const config: AIConfig = { enabled: true, provider: "mock", timeoutMs: 10 };
  const cache = new MockCache();
  const service = new AIService(provider, config, cache);

  await assert.rejects(
    service.summarizeCommit("abc", "feat: test", "diff content"),
    /timed out/
  );
});
