
import { TechnicalAnalysis, CandlestickData, TradingSignal } from '../../technicalAnalysis';
import { riskManagement } from '../riskManagement';

export class StandardSignalProcessor {
  private ta = new TechnicalAnalysis();

  async processStandardSignal(candlestickData: CandlestickData[], selectedPair: string): Promise<TradingSignal> {
    console.log(`📊 Processing STANDARD signal for ${selectedPair}`);

    // Calculate basic indicators
    const indicators = this.calculateBasicIndicators(candlestickData);
    
    // Generate base signal
    const baseSignal = this.ta.generateEnhancedSignal(candlestickData, indicators, selectedPair);
    
    if (!baseSignal || baseSignal.type === 'NEUTRAL') {
      return baseSignal || this.createNeutralSignal(selectedPair);
    }

    // Apply realistic risk management
    const riskMetrics = riskManagement.calculateEnhancedRisk(baseSignal, candlestickData, 10000);
    
    // Create realistic signal
    const standardSignal: TradingSignal = {
      ...baseSignal,
      positionSize: riskMetrics.optimalPositionSize, // This will be 1-5% now
      leverage: Math.min(baseSignal.leverage || 1, 5), // Cap leverage at 5x for standard
      stopLoss: riskMetrics.dynamicStopLoss,
      takeProfit: riskMetrics.dynamicTakeProfit,
      riskReward: riskMetrics.riskRewardRatio
    };

    console.log(`✅ STANDARD SIGNAL: ${standardSignal.type} ${selectedPair}`, {
      positionSize: `${standardSignal.positionSize.toFixed(2)}%`,
      marginRequired: `$${(10000 * standardSignal.positionSize / 100).toFixed(2)}`,
      leverage: `${standardSignal.leverage}x`,
      confidence: `${(standardSignal.confidence * 100).toFixed(1)}%`
    });

    return standardSignal;
  }

  private calculateBasicIndicators(candlestickData: CandlestickData[]) {
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

  private createNeutralSignal(selectedPair: string): TradingSignal {
    return {
      type: 'NEUTRAL',
      entry: 0,
      stopLoss: 0,
      takeProfit: 0,
      confidence: 0,
      riskReward: 0,
      positionSize: 0,
      leverage: 1,
      patterns: [],
      indicators: {},
      tradingFees: 0,
      netProfit: 0,
      netLoss: 0
    };
  }
}
