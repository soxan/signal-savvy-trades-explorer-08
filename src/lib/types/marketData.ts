
export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  volumeQuality?: 'VERY_HIGH' | 'HIGH' | 'NORMAL' | 'LOW';
  additionalData?: {
    volumeQuality?: 'VERY_HIGH' | 'HIGH' | 'NORMAL' | 'LOW';
    volumeScore?: number;
    isVolumeRealistic?: boolean;
  };
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
