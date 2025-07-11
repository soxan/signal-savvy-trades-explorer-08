
import { CandlestickData, TradingSignal, TechnicalAnalysis } from '../../technicalAnalysis';
import { MarketData } from '@/lib/types/marketData';

export class AdaptiveSignalProcessor {
  private ta = new TechnicalAnalysis();

  async processAdaptiveSignal(
    candlestickData: CandlestickData[], 
    selectedPair: string, 
    marketData: MarketData[]
  ): Promise<TradingSignal> {
    console.log(`🚀 Processing adaptive signal for ${selectedPair}`);
    
    if (candlestickData.length < 20) {
      throw new Error(`Insufficient data: ${candlestickData.length} candles`);
    }

    // Calculate basic indicators
    const closes = candlestickData.map(d => d.close);
    const highs = candlestickData.map(d => d.high);
    const lows = candlestickData.map(d => d.low);
    const volumes = candlestickData.map(d => d.volume);

    const indicators = {
      rsi: this.ta.calculateRSI(closes, 14),
      macd: this.ta.calculateMACD(closes),
      sma: this.ta.calculateSMA(closes, 20),
      ema: this.ta.calculateEMA(closes, 12),
      bollingerBands: this.ta.calculateBollingerBands(closes),
      stochastic: this.ta.calculateStochastic(highs, lows, closes),
      williams: this.ta.calculateWilliamsR(highs, lows, closes),
      atr: this.ta.calculateATR(highs, lows, closes),
      vwap: this.ta.calculateVWAP(highs, lows, closes, volumes),
      adx: this.ta.calculateADX(highs, lows, closes),
      cci: this.ta.calculateCCI(highs, lows, closes)
    };

    // Market context analysis
    const marketContext = this.analyzeMarketContext(marketData, selectedPair);
    
    // Generate signal with market adaptation
    const baseSignal = this.ta.generateEnhancedSignal(candlestickData, indicators, selectedPair);
    
    if (!baseSignal) {
      throw new Error('Failed to generate base signal');
    }

    // Adapt signal based on market context
    const adaptedSignal = this.adaptSignalToMarket(baseSignal, marketContext, selectedPair);
    
    console.log(`✅ Adaptive signal generated for ${selectedPair}: ${adaptedSignal.type} (${(adaptedSignal.confidence * 100).toFixed(1)}%)`);
    
    return adaptedSignal;
  }

  private analyzeMarketContext(marketData: MarketData[], selectedPair: string) {
    const pair = marketData.find(m => m.symbol === selectedPair);
    if (!pair) {
      return { trend: 'NEUTRAL', strength: 0.5, volatility: 0.02 };
    }

    const changePercent = parseFloat(pair.changePercent24h.toString().replace('%', '')) / 100;
    const volume = parseFloat(pair.volume24h.toString());
    
    let trend = 'NEUTRAL';
    let strength = Math.abs(changePercent);
    
    if (changePercent > 0.02) trend = 'BULLISH';
    else if (changePercent < -0.02) trend = 'BEARISH';
    
    const volatility = Math.min(0.1, Math.abs(changePercent));
    
    return { trend, strength, volatility };
  }

  private adaptSignalToMarket(
    baseSignal: TradingSignal, 
    marketContext: any, 
    selectedPair: string
  ): TradingSignal {
    let adaptedSignal = { ...baseSignal };
    
    // Boost confidence in trending markets
    if (marketContext.trend === 'BULLISH' && baseSignal.type === 'BUY') {
      adaptedSignal.confidence = Math.min(0.95, baseSignal.confidence * 1.3);
      adaptedSignal.patterns = [...baseSignal.patterns, 'Market Trend Alignment'];
    } else if (marketContext.trend === 'BEARISH' && baseSignal.type === 'SELL') {
      adaptedSignal.confidence = Math.min(0.95, baseSignal.confidence * 1.3);
      adaptedSignal.patterns = [...baseSignal.patterns, 'Market Trend Alignment'];
    }
    
    // Ensure minimum confidence for valid signals
    if (adaptedSignal.confidence < 0.05) {
      adaptedSignal.confidence = Math.max(0.05, adaptedSignal.confidence * 2);
      adaptedSignal.patterns = [...adaptedSignal.patterns, 'Adaptive Boost'];
    }

    return adaptedSignal;
  }
}
