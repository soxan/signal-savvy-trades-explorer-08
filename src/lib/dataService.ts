
// Re-export everything from the refactored modules for backward compatibility
export type { MarketData, CandlestickData } from './types/marketData';
export { marketDataService as dataService } from './services/marketDataService';
