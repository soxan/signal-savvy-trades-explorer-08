// Business logic extracted from useTradingData hook
import { marketDataService } from './marketDataService';
import { MarketData } from '../types/marketData';
import { CandlestickData } from '../technicalAnalysis';
import { eventBus } from '../core/EventBus';

export class TradingDataService {
  private static instance: TradingDataService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): TradingDataService {
    if (!TradingDataService.instance) {
      TradingDataService.instance = new TradingDataService();
    }
    return TradingDataService.instance;
  }

  async getMarketData(tradingPairs: string[]): Promise<MarketData[]> {
    const cacheKey = `market_data_${tradingPairs.join('_')}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('📦 Using cached market data');
      return cached;
    }

    try {
      console.log('🔄 Fetching fresh market data...');
      const data = await marketDataService.getEnhancedMarketData(tradingPairs);
      
      // Cache for 12 seconds
      this.setCache(cacheKey, data, 12000);
      
      // Emit event
      eventBus.emit('market:data:updated', { data, timestamp: Date.now() });
      
      console.log(`✅ Market data fetched: ${data.length} symbols`);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch market data:', error);
      eventBus.emit('system:health:critical', { 
        component: 'TradingDataService', 
        issue: 'Market data fetch failed' 
      });
      throw error;
    }
  }

  async getCandlestickData(pair: string, timeframe: string, limit = 200): Promise<CandlestickData[]> {
    const cacheKey = `candles_${pair}_${timeframe}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log(`📦 Using cached candlestick data for ${pair}`);
      return cached;
    }

    try {
      console.log(`🔄 Fetching candlestick data for ${pair} ${timeframe}`);
      const data = await marketDataService.getCandlestickData(pair, timeframe, limit);
      
      // Cache for 30 seconds
      this.setCache(cacheKey, data, 30000);
      
      console.log(`✅ Candlestick data fetched: ${data.length} candles`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch candlestick data for ${pair}:`, error);
      throw error;
    }
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key);
      eventBus.emit('cache:invalidated', { key, reason: 'TTL expired' });
    }, ttl);
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      eventBus.emit('cache:invalidated', { key, reason: 'TTL expired' });
      return null;
    }

    return cached.data;
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        eventBus.emit('cache:invalidated', { key, reason: 'Manual clear' });
      });
    } else {
      this.cache.clear();
      eventBus.emit('cache:invalidated', { key: 'all', reason: 'Full cache clear' });
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const tradingDataService = TradingDataService.getInstance();