
import { CandlestickData, TradingSignal, TechnicalAnalysis } from '../../technicalAnalysis';

export class StandardSignalProcessor {
  private ta = new TechnicalAnalysis();

  async processStandardSignal(candlestickData: CandlestickData[], selectedPair: string): Promise<TradingSignal> {
    console.log(`🔄 Processing standard signal for ${selectedPair}`);
    
    if (candlestickData.length < 20) {
      throw new Error(`Insufficient data: ${candlestickData.length} candles`);
    }

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

    const signal = this.ta.generateSignal(candlestickData, indicators);
    
    console.log(`✅ Standard signal generated for ${selectedPair}: ${signal.type} (${(signal.confidence * 100).toFixed(1)}%)`);
    
    return signal;
  }
}
