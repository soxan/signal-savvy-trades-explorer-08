
import { CandlestickData, TradingSignal, TechnicalAnalysis } from '../../technicalAnalysis';

export class StandardSignalProcessor {
  private ta = new TechnicalAnalysis();

  async processStandardSignal(candlestickData: CandlestickData[], selectedPair: string): Promise<TradingSignal> {
    console.log(`📊 Processing standard signal for ${selectedPair}`);
    
    if (candlestickData.length < 15) {
      throw new Error(`Insufficient data: ${candlestickData.length} candles`);
    }

    // Calculate indicators
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

    // Generate enhanced signal
    const signal = this.ta.generateEnhancedSignal(candlestickData, indicators, selectedPair);
    
    if (!signal) {
      // Create a basic fallback signal
      const currentPrice = candlestickData[candlestickData.length - 1].close;
      return {
        type: 'NEUTRAL',
        confidence: 0.05,
        patterns: ['Standard Analysis'],
        entry: currentPrice,
        stopLoss: currentPrice * 0.98,
        takeProfit: currentPrice * 1.02,
        riskReward: 2.0,
        leverage: 1,
        positionSize: 1.0,
        tradingFees: 0.1,
        netProfit: 0,
        netLoss: 0
      };
    }

    console.log(`✅ Standard signal generated for ${selectedPair}: ${signal.type} (${(signal.confidence * 100).toFixed(1)}%)`);
    
    return signal;
  }
}
