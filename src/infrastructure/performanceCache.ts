export interface CacheEntry<T> {
  value: T;
  createdAt: number;
}

export class LocalTtlCache<T> {
  private readonly values = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs = 3000) {}

  get(key: string): T | undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.values.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    this.values.set(key, { value, createdAt: Date.now() });
  }

  clear(): void {
    this.values.clear();
  }
}
