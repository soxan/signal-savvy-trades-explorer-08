// Circuit breaker pattern for API resilience
import { eventBus } from '../core/EventBus';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN', 
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private requestCount = 0;

  constructor(
    private config: CircuitBreakerConfig,
    private name: string
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log(`🔄 Circuit breaker ${this.name}: HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    this.requestCount++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    
    if (this.state === CircuitState.HALF_OPEN && this.successCount >= 3) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      console.log(`✅ Circuit breaker ${this.name}: CLOSED (recovered)`);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.error(`🚨 Circuit breaker ${this.name}: OPEN (${this.failureCount} failures)`);
      
      eventBus.emit('system:health:critical', {
        component: `CircuitBreaker:${this.name}`,
        issue: `Circuit opened after ${this.failureCount} failures`
      });
    }
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    console.log(`🔄 Circuit breaker ${this.name}: Reset`);
  }
}

// Circuit breaker instances for different services
export class CircuitBreakerService {
  private static instance: CircuitBreakerService;
  private breakers = new Map<string, CircuitBreaker>();

  static getInstance(): CircuitBreakerService {
    if (!CircuitBreakerService.instance) {
      CircuitBreakerService.instance = new CircuitBreakerService();
    }
    return CircuitBreakerService.instance;
  }

  getBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 10000 // 10 seconds
      };
      
      this.breakers.set(name, new CircuitBreaker(config || defaultConfig, name));
    }
    return this.breakers.get(name)!;
  }

  getAllStats() {
    return Array.from(this.breakers.values()).map(breaker => breaker.getStats());
  }

  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

export const circuitBreakerService = CircuitBreakerService.getInstance();