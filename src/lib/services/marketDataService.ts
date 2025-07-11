import { BinanceAPI } from '../api/binanceApi';
import { CoinGeckoAPI } from '../api/coinGeckoApi';
import { MarketData, CandlestickData } from '../types/marketData';

// Re-export MarketData for backward compatibility
export type { MarketData } from '../types/marketData';

export class MarketDataService {
  private binanceAPI = new BinanceAPI();
  private coinGeckoAPI = new CoinGeckoAPI();
  private dataCache = new Map<string, {data: MarketData[], timestamp: number}>();
  private priceCache = new Map<string, {price: number, timestamp: number}>();

  // Improved volume expectations for better validation
  private getVolumeExpectations(symbol: string) {
    const expectations = {
      'BTC/USDT': { min: 500_000_000, realistic: 1_500_000_000, high: 3_000_000_000 },
      'ETH/USDT': { min: 300_000_000, realistic: 800_000_000, high: 2_000_000_000 },
      'ADA/USDT': { min: 50_000_000, realistic: 120_000_000, high: 300_000_000 },
      'SOL/USDT': { min: 30_000_000, realistic: 80_000_000, high: 200_000_000 },
      'XRP/USDT': { min: 100_000_000, realistic: 250_000_000, high: 600_000_000 },
      'DOGE/USDT': { min: 200_000_000, realistic: 500_000_000, high: 1_200_000_000 },
      'DOT/USDT': { min: 20_000_000, realistic: 50_000_000, high: 120_000_000 },
      'LINK/USDT': { min: 15_000_000, realistic: 40_000_000, high: 100_000_000 },
      'AVAX/USDT': { min: 10_000_000, realistic: 30_000_000, high: 80_000_000 }
    };

    return expectations[symbol as keyof typeof expectations] || 
           { min: 5_000_000, realistic: 20_000_000, high: 50_000_000 };
  }

  private validateAndEnhanceVolumeData(data: MarketData): MarketData {
    const expectations = this.getVolumeExpectations(data.symbol);
    const isRealistic = data.volume24h >= expectations.min;
    const isHigh = data.volume24h >= expectations.realistic;
    const isVeryHigh = data.volume24h >= expectations.high;

    console.log(`📊 OPTIMIZED VOLUME for ${data.symbol}:`, {
      rawVolume: data.volume24h,
      formatted: data.volume24h > 1_000_000_000 ? 
        (data.volume24h / 1_000_000_000).toFixed(2) + 'B' : 
        (data.volume24h / 1_000_000).toFixed(0) + 'M',
      isRealistic,
      isHigh,
      isVeryHigh,
      expectations: {
        min: (expectations.min / 1_000_000).toFixed(0) + 'M',
        realistic: (expectations.realistic / 1_000_000).toFixed(0) + 'M',
        high: (expectations.high / 1_000_000).toFixed(0) + 'M'
      }
    });

    return {
      ...data,
      // Add volume quality metadata without changing the original volume
      additionalData: {
        volumeQuality: isVeryHigh ? 'VERY_HIGH' : isHigh ? 'HIGH' : isRealistic ? 'NORMAL' : 'LOW',
        volumeScore: isVeryHigh ? 30 : isHigh ? 20 : isRealistic ? 10 : 5,
        isVolumeRealistic: isRealistic
      }
    };
  }

  async getEnhancedMarketData(symbols: string[]): Promise<MarketData[]> {
    // Check cache first (5 second cache)
    const cacheKey = symbols.join(',');
    const cached = this.dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5000) {
      console.log('📦 Using cached market data');
      return cached.data;
    }

    console.log(`🔄 Cross-verifying market data from multiple APIs: Binance + CoinGecko`);
    
    try {
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const [binanceData, coinGeckoData] = await Promise.allSettled([
              this.binanceAPI.getMarketData(symbol),
              this.coinGeckoAPI.getMarketData(symbol)
            ]);

            let finalData: MarketData | null = null;
            let dataSource = '';

            if (binanceData.status === 'fulfilled' && binanceData.value) {
              finalData = binanceData.value;
              dataSource = 'Binance';
            }

            if (coinGeckoData.status === 'fulfilled' && coinGeckoData.value) {
              const cgData = coinGeckoData.value;
              
              if (finalData) {
                const priceDiff = Math.abs(finalData.price - cgData.price) / finalData.price;
                
                // Only log significant price differences
                if (priceDiff > 0.005) {
                  console.log(`🔍 Price difference for ${symbol}:`, {
                    binancePrice: finalData.price.toFixed(2),
                    coinGeckoPrice: cgData.price.toFixed(2),
                    difference: (priceDiff * 100).toFixed(2) + '%'
                  });
                }

                // Use higher volume if significantly different
                if (cgData.volume24h > finalData.volume24h * 1.2) {
                  finalData.volume24h = cgData.volume24h;
                  finalData.marketCap = cgData.marketCap;
                }

                // Average prices if they're close
                if (priceDiff < 0.01) {
                  finalData.price = (finalData.price + cgData.price) / 2;
                }

                dataSource = 'Binance + CoinGecko (Cross-verified)';
              } else {
                finalData = cgData;
                dataSource = 'CoinGecko (Fallback)';
              }
            }

            if (finalData) {
              finalData = this.validateAndEnhanceVolumeData(finalData);
              console.log(`✅ Enhanced data for ${symbol} (${dataSource})`);
            }

            return finalData;
          } catch (error) {
            console.error(`❌ Failed to fetch cross-verified data for ${symbol}:`, error);
            return null;
          }
        })
      );
      
      const validResults = results.filter((result): result is MarketData => result !== null);
      
      if (validResults.length === 0) {
        throw new Error('No valid market data received from any API');
      }
      
      // Cache the results
      this.dataCache.set(cacheKey, {
        data: validResults,
        timestamp: Date.now()
      });
      
      return validResults;
    } catch (error) {
      console.error('❌ Cross-verified market data fetch failed:', error);
      throw new Error('Failed to fetch market data from multiple APIs');
    }
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    // Check cache first (3 second cache for prices)
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < 3000) {
      return cached.price;
    }

    console.log(`🔄 Fetching optimized price for ${symbol}`);

    try {
      const [binanceData, coinGeckoData] = await Promise.allSettled([
        this.binanceAPI.getMarketData(symbol),
        this.coinGeckoAPI.getMarketData(symbol)
      ]);

      let price = 0;
      let priceCount = 0;
      
      if (binanceData.status === 'fulfilled' && binanceData.value) {
        price += binanceData.value.price;
        priceCount++;
      }
      
      if (coinGeckoData.status === 'fulfilled' && coinGeckoData.value) {
        const cgPrice = coinGeckoData.value.price;
        price += cgPrice;
        priceCount++;
      }

      if (priceCount === 0) {
        throw new Error('No price data available from any source');
      }

      const finalPrice = price / priceCount;
      
      // Cache the price
      this.priceCache.set(symbol, {
        price: finalPrice,
        timestamp: Date.now()
      });

      return finalPrice;
    } catch (error) {
      console.error(`❌ Failed to fetch optimized price for ${symbol}:`, error);
      throw new Error(`Unable to fetch price for ${symbol}`);
    }
  }

  async getCandlestickData(symbol: string, interval: string = '1h', limit: number = 200): Promise<CandlestickData[]> {
    return this.binanceAPI.getCandlestickData(symbol, interval, limit);
  }

  subscribeToRealTimeUpdates(symbols: string[], callback: (data: MarketData) => void): () => void {
    let isActive = true;
    let updateInterval: NodeJS.Timeout;
    
    const updatePrices = async () => {
      if (!isActive) return;
      
      try {
        const marketData = await this.getEnhancedMarketData(symbols);
        marketData.forEach(callback);
      } catch (error) {
        console.error('❌ Real-time update failed:', error);
      }
      
      if (isActive) {
        // Reduced frequency for better performance
        updateInterval = setTimeout(updatePrices, 20000); // 20 seconds instead of 15
      }
    };

    updatePrices();

    return () => {
      isActive = false;
      if (updateInterval) {
        clearTimeout(updateInterval);
      }
    };
  }

  async getExchangeStatus() {
    const [binance, coinGecko] = await Promise.all([
      this.binanceAPI.checkStatus(),
      this.coinGeckoAPI.checkStatus()
    ]);

    return { binance, coinGecko };
  }

  // Clear caches periodically
  clearCaches() {
    const now = Date.now();
    
    // Clear data cache (older than 30 seconds)
    for (const [key, value] of this.dataCache.entries()) {
      if (now - value.timestamp > 30000) {
        this.dataCache.delete(key);
      }
    }
    
    // Clear price cache (older than 15 seconds)
    for (const [key, value] of this.priceCache.entries()) {
      if (now - value.timestamp > 15000) {
        this.priceCache.delete(key);
      }
    }
  }
}

export const marketDataService = new MarketDataService();

// Auto-clear caches every minute
setInterval(() => {
  marketDataService.clearCaches();
}, 60000);
