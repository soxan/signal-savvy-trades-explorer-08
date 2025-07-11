// Smart signal caching with invalidation strategies
import { TradingSignal } from '../technicalAnalysis';
import { eventBus } from '../core/EventBus';

interface CachedSignal {
  signal: TradingSignal;
  timestamp: number;
  pair: string;
  candlestickHash: string;
  marketConditionHash: string;
  ttl: number;
}

export class SignalCacheService {
  private static instance: SignalCacheService;
  private cache = new Map<string, CachedSignal>();
  private hitCount = 0;
  private missCount = 0;

  static getInstance(): SignalCacheService {
    if (!SignalCacheService.instance) {
      SignalCacheService.instance = new SignalCacheService();
    }
    return SignalCacheService.instance;
  }

  generateCacheKey(pair: string, candlestickHash: string, marketConditionHash: string): string {
    return `signal_${pair}_${candlestickHash}_${marketConditionHash}`;
  }

  hashCandlestickData(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    // Use last 10 candles for hashing to detect changes
    const relevantData = data.slice(-10);
    const hashString = relevantData.map(d => 
      `${d.open}_${d.high}_${d.low}_${d.close}_${d.volume}`
    ).join('|');
    
    return this.simpleHash(hashString);
  }

  hashMarketConditions(marketData: any[]): string {
    if (!marketData || marketData.length === 0) return '';
    
    // Hash market conditions that affect signals
    const hashString = marketData.map(d => 
      `${d.symbol}_${d.price}_${d.changePercent24h}_${d.volume24h}`
    ).join('|');
    
    return this.simpleHash(hashString);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  get(pair: string, candlestickHash: string, marketConditionHash: string): TradingSignal | null {
    const key = this.generateCacheKey(pair, candlestickHash, marketConditionHash);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.missCount++;
      return null;
    }

    // Check TTL
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      eventBus.emit('cache:invalidated', { key, reason: 'TTL expired' });
      this.missCount++;
      return null;
    }

    this.hitCount++;
    console.log(`📦 Cache HIT for ${pair} (${this.getHitRate().toFixed(1)}% hit rate)`);
    return cached.signal;
  }

  set(
    pair: string, 
    signal: TradingSignal, 
    candlestickHash: string, 
    marketConditionHash: string, 
    ttl: number = 30000
  ): void {
    const key = this.generateCacheKey(pair, candlestickHash, marketConditionHash);
    
    this.cache.set(key, {
      signal,
      timestamp: Date.now(),
      pair,
      candlestickHash,
      marketConditionHash,
      ttl
    });

    console.log(`💾 Cached signal for ${pair} (TTL: ${ttl}ms)`);

    // Auto-cleanup
    setTimeout(() => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
        eventBus.emit('cache:invalidated', { key, reason: 'TTL cleanup' });
      }
    }, ttl);
  }

  invalidate(pair?: string): void {
    if (pair) {
      // Invalidate all signals for specific pair
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(`signal_${pair}_`));
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        eventBus.emit('cache:invalidated', { key, reason: `Pair ${pair} invalidated` });
      });
      console.log(`🗑️ Invalidated ${keysToDelete.length} cached signals for ${pair}`);
    } else {
      // Clear all
      const count = this.cache.size;
      this.cache.clear();
      console.log(`🗑️ Invalidated all ${count} cached signals`);
      eventBus.emit('cache:invalidated', { key: 'all_signals', reason: 'Full invalidation' });
    }
  }

  getStats() {
    const hitRate = this.getHitRate();
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: hitRate,
      keys: Array.from(this.cache.keys())
    };
  }

  private getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  // Advanced invalidation strategies
  invalidateByAge(maxAge: number): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((cached, key) => {
      if (now - cached.timestamp > maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      eventBus.emit('cache:invalidated', { key, reason: `Exceeded max age ${maxAge}ms` });
    });

    if (keysToDelete.length > 0) {
      console.log(`🗑️ Invalidated ${keysToDelete.length} signals by age`);
    }
  }

  invalidateByPattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      eventBus.emit('cache:invalidated', { key, reason: `Pattern match: ${pattern}` });
    });

    if (keysToDelete.length > 0) {
      console.log(`🗑️ Invalidated ${keysToDelete.length} signals by pattern: ${pattern}`);
    }
  }

  // Cleanup old entries periodically
  startPeriodicCleanup(interval: number = 60000): () => void {
    const cleanup = setInterval(() => {
      this.invalidateByAge(300000); // Remove entries older than 5 minutes
    }, interval);

    return () => clearInterval(cleanup);
  }
}

export const signalCacheService = SignalCacheService.getInstance();