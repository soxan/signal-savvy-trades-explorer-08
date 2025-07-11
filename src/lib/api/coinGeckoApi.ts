
import axios from 'axios';
import { MarketData } from '../types/marketData';

export class CoinGeckoAPI {
  private coinGeckoAPI = 'https://api.coingecko.com/api/v3';

  private coinGeckoSymbols: { [key: string]: string } = {
    'BTC/USDT': 'bitcoin',
    'ETH/USDT': 'ethereum',
    'ADA/USDT': 'cardano',
    'SOL/USDT': 'solana',
    'XRP/USDT': 'ripple',
    'DOGE/USDT': 'dogecoin',
    'DOT/USDT': 'polkadot',
    'LINK/USDT': 'chainlink',
    'AVAX/USDT': 'avalanche-2'
  };

  async getMarketData(symbol: string): Promise<MarketData | null> {
    const coinId = this.coinGeckoSymbols[symbol];
    if (!coinId) return null;

    try {
      const response = await axios.get(
        `${this.coinGeckoAPI}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
        { 
          timeout: 10000,
          headers: { 'Accept': 'application/json' }
        }
      );

      const data = response.data;
      const marketData = data.market_data;

      if (!marketData) return null;

      return {
        symbol,
        price: marketData.current_price?.usd || 0,
        change24h: marketData.price_change_24h || 0,
        changePercent24h: marketData.price_change_percentage_24h || 0,
        volume24h: marketData.total_volume?.usd || 0,
        marketCap: marketData.market_cap?.usd || 0,
        high24h: marketData.high_24h?.usd || 0,
        low24h: marketData.low_24h?.usd || 0
      };
    } catch (error) {
      console.warn(`⚠️ CoinGecko API failed for ${symbol}:`, error.message);
      return null;
    }
  }

  async checkStatus(): Promise<boolean> {
    try {
      await axios.get(`${this.coinGeckoAPI}/ping`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
