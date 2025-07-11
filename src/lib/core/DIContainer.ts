// Dependency Injection Container for better testability and modularity
export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  register<T>(key: string, factory: () => T, singleton = false): void {
    if (singleton) {
      this.singletons.set(key, factory);
    } else {
      this.services.set(key, factory);
    }
  }

  get<T>(key: string): T {
    if (this.singletons.has(key)) {
      const factory = this.singletons.get(key);
      const instance = factory();
      // Replace factory with instance for subsequent calls
      this.singletons.set(key, () => instance);
      return instance;
    }

    if (this.services.has(key)) {
      const factory = this.services.get(key);
      return factory();
    }

    throw new Error(`Service '${key}' not found in DI container`);
  }

  has(key: string): boolean {
    return this.services.has(key) || this.singletons.has(key);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}

export const container = DIContainer.getInstance();