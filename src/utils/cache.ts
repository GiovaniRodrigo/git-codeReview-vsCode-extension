export class TimedCache<T> {
  private readonly values = new Map<string, { value: T; expiresAt: number }>();

  public constructor(private readonly ttlMs: number) {}

  public get(key: string): T | undefined {
    const cached = this.values.get(key);
    if (!cached) {
      return undefined;
    }

    if (Date.now() > cached.expiresAt) {
      this.values.delete(key);
      return undefined;
    }

    return cached.value;
  }

  public set(key: string, value: T): void {
    this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  public clear(): void {
    this.values.clear();
  }
}
