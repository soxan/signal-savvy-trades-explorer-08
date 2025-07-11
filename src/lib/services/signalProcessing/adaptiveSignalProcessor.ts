
import { TechnicalAnalysis, CandlestickData, TradingSignal } from '../../technicalAnalysis';
import { MarketData } from '../../types/marketData';
import { riskManagement } from '../riskManagement';

export class AdaptiveSignalProcessor {
  private ta = new TechnicalAnalysis();

  async processAdaptiveSignal(
    candlestickData: CandlestickData[],
    selectedPair: string,
    marketData: MarketData[]
  ): Promise<TradingSignal> {
    console.log(`🧠 Processing ADAPTIVE signal for ${selectedPair}`);

    // Calculate comprehensive indicators
    const indicators = this.calculateComprehensiveIndicators(candlestickData);
    
    // Generate enhanced signal with market context
    const baseSignal = this.ta.generateEnhancedSignal(candlestickData, indicators, selectedPair);
    
    if (!baseSignal || baseSignal.type === 'NEUTRAL') {
      return baseSignal || this.createNeutralSignal(selectedPair);
    }

    // Apply realistic risk management
    const riskMetrics = riskManagement.calculateEnhancedRisk(baseSignal, candlestickData, 10000);
    
    // Create realistic signal with proper position sizing
    const adaptiveSignal: TradingSignal = {
      ...baseSignal,
      positionSize: riskMetrics.optimalPositionSize, // This will be 1-5% now
      leverage: Math.min(baseSignal.leverage || 1, 10), // Cap leverage at 10x
      stopLoss: riskMetrics.dynamicStopLoss,
      takeProfit: riskMetrics.dynamicTakeProfit,
      riskReward: riskMetrics.riskRewardRatio,
      confidence: Math.min(baseSignal.confidence * 1.1, 0.95), // Slight boost for adaptive
      marketCondition: this.analyzeMarketCondition(marketData),
      volatilityScore: riskMetrics.volatilityAdjustment,
      timestamp: Date.now()
    };

    console.log(`✅ ADAPTIVE SIGNAL: ${adaptiveSignal.type} ${selectedPair}`, {
      positionSize: `${adaptiveSignal.positionSize.toFixed(2)}%`,
      marginRequired: `$${(10000 * adaptiveSignal.positionSize / 100).toFixed(2)}`,
      leverage: `${adaptiveSignal.leverage}x`,
      confidence: `${(adaptiveSignal.confidence * 100).toFixed(1)}%`
    });

    return adaptiveSignal;
  }

  private calculateComprehensiveIndicators(candlestickData: CandlestickData[]) {
    const closes = candlestickData.map(d => d.close);
    const highs = candlestickData.map(d => d.high);
    const lows = candlestickData.map(d => d.low);
    const volumes = candlestickData.map(d => d.volume);

    return {
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
  }

  private analyzeMarketCondition(marketData: MarketData[]): string {
    if (!marketData || marketData.length < 10) return 'UNKNOWN';
    
    const positiveCount = marketData.filter(m => (m.priceChangePercent || 0) > 0).length;
    const ratio = positiveCount / marketData.length;
    
    if (ratio > 0.6) return 'BULLISH';
    if (ratio < 0.4) return 'BEARISH';
    return 'NEUTRAL';
  }

  private createNeutralSignal(selectedPair: string): TradingSignal {
    return {
      type: 'NEUTRAL',
      pair: selectedPair,
      entry: 0,
      stopLoss: 0,
      takeProfit: 0,
      confidence: 0,
      riskReward: 0,
      positionSize: 0,
      leverage: 1,
      patterns: [],
      indicators: {},
      timestamp: Date.now(),
      marketCondition: 'NEUTRAL'
    };
  }
}
