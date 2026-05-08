import { RemoteProvider } from "./types";

export class ProviderRegistry {
  private providers: RemoteProvider[] = [];

  public register(provider: RemoteProvider): void {
    this.providers.push(provider);
  }

  public async detectProviders(rootPath: string): Promise<RemoteProvider[]> {
    const active: RemoteProvider[] = [];
    for (const provider of this.providers) {
      if (await provider.detect(rootPath)) {
        active.push(provider);
      }
    }
    return active;
  }

  public getProviders(): RemoteProvider[] {
    return [...this.providers];
  }
}
