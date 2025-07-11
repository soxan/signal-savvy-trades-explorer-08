
import axios from 'axios';
import { MarketData, CandlestickData } from '../types/marketData';

export class BinanceAPI {
  private binanceAPI = 'https://api.binance.com/api/v3';
  private binanceUSAPI = 'https://api.binance.us/api/v3';

  private exchangeSymbols: { [key: string]: string } = {
    'BTC/USDT': 'BTCUSDT',
    'ETH/USDT': 'ETHUSDT',
    'ADA/USDT': 'ADAUSDT',
    'SOL/USDT': 'SOLUSDT',
    'XRP/USDT': 'XRPUSDT',
    'DOGE/USDT': 'DOGEUSDT',
    'DOT/USDT': 'DOTUSDT',
    'LINK/USDT': 'LINKUSDT',
    'AVAX/USDT': 'AVAXUSDT'
  };

  async getMarketData(symbol: string): Promise<MarketData | null> {
    const exchangeSymbol = this.exchangeSymbols[symbol];
    if (!exchangeSymbol) return null;

    try {
      const responses = await Promise.allSettled([
        axios.get(`${this.binanceAPI}/ticker/24hr?symbol=${exchangeSymbol}`, { 
          timeout: 8000,
          headers: { 'Accept': 'application/json' }
        }),
        axios.get(`${this.binanceUSAPI}/ticker/24hr?symbol=${exchangeSymbol}`, {
          timeout: 8000,
          headers: { 'Accept': 'application/json' }
        })
      ]);
      
      const successfulResponse = responses.find(r => r.status === 'fulfilled');
      if (!successfulResponse || successfulResponse.status !== 'fulfilled') {
        return null;
      }
      
      const data = successfulResponse.value.data;
      
      return {
        symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChange),
        changePercent24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.quoteVolume),
        marketCap: 0,
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice)
      };
    } catch (error) {
      console.warn(`⚠️ Binance API failed for ${symbol}:`, error.message);
      return null;
    }
  }

  async getCandlestickData(symbol: string, interval: string = '1h', limit: number = 200): Promise<CandlestickData[]> {
    const exchangeSymbol = this.exchangeSymbols[symbol];
    if (!exchangeSymbol) {
      throw new Error(`Trading pair ${symbol} is not supported`);
    }

    const binanceInterval = this.mapIntervalToBinance(interval);
    console.log(`🔄 Fetching candlestick data for ${symbol} ${interval}`);

    try {
      const response = await axios.get(
        `${this.binanceAPI}/klines?symbol=${exchangeSymbol}&interval=${binanceInterval}&limit=${limit}`,
        { 
          timeout: 10000,
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.data || response.data.length === 0) {
        throw new Error(`No candlestick data available for ${symbol}`);
      }

      console.log(`✅ Candlestick data: ${response.data.length} candles for ${symbol}`);
      return this.formatKlines(response.data);
    } catch (error) {
      console.error(`❌ Failed to fetch candlestick data for ${symbol}:`, error);
      throw new Error(`Unable to fetch candlestick data for ${symbol}`);
    }
  }

  private formatKlines(klines: any[]): CandlestickData[] {
    return klines.map((kline: any[]) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));
  }

  private mapIntervalToBinance(interval: string): string {
    const mapping: { [key: string]: string } = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d'
    };
    return mapping[interval] || '1h';
  }

  async checkStatus(): Promise<boolean> {
    try {
      await axios.get(`${this.binanceAPI}/ping`, { timeout: 5000 });
      return true;
    } catch {
      try {
        await axios.get(`${this.binanceUSAPI}/ping`, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }
}
