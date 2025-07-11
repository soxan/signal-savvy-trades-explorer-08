import { TechnicalAnalysis, CandlestickData, TradingSignal } from '../technicalAnalysis';
import { activeSignalGenerator } from './activeSignalGenerator';

export class OptimizedSignalProcessor {
  private ta = new TechnicalAnalysis();
  private processedSignals = new Map<string, { timestamp: number; signal: TradingSignal }>();
  private processingStats = {
    totalProcessed: 0,
    successRate: 0,
    avgConfidence: 0,
    lastUpdate: Date.now()
  };

  async processSignal(
    candlestickData: CandlestickData[],
    selectedPair: string,
    enhanced: boolean = true
  ): Promise<TradingSignal | null> {
    
    if (candlestickData.length < 15) { // Reduced minimum requirement
      console.log(`⚠️ Insufficient data for ${selectedPair}: ${candlestickData.length} candles`);
      return null;
    }

    try {
      console.log(`🚀 Processing optimized signal for ${selectedPair} (Enhanced: ${enhanced})`);
      
      let signal: TradingSignal | null = null;
      
      if (enhanced) {
        // Use the new active signal generator
        signal = activeSignalGenerator.generateActiveSignal(candlestickData, selectedPair);
      } else {
        // Fallback to standard processing
        signal = await this.processStandardSignal(candlestickData, selectedPair);
      }
      
      if (signal) {
        this.updateProcessingStats(signal);
        this.cacheSignal(selectedPair, signal);
        
        console.log(`✅ OPTIMIZED SIGNAL: ${signal.type} for ${selectedPair} - ${(signal.confidence * 100).toFixed(1)}%`);
      }
      
      return signal;
    } catch (error) {
      console.error(`❌ Error processing signal for ${selectedPair}:`, error);
      return null;
    }
  }

  private async processStandardSignal(candlestickData: CandlestickData[], selectedPair: string): Promise<TradingSignal | null> {
    const indicators = this.calculateIndicators(candlestickData);
    return this.ta.generateEnhancedSignal(candlestickData, indicators, selectedPair);
  }

  private calculateIndicators(candlestickData: CandlestickData[]) {
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

  private updateProcessingStats(signal: TradingSignal) {
    this.processingStats.totalProcessed++;
    this.processingStats.avgConfidence = 
      (this.processingStats.avgConfidence * (this.processingStats.totalProcessed - 1) + signal.confidence) / 
      this.processingStats.totalProcessed;
    this.processingStats.successRate = signal.type !== 'NEUTRAL' ? 
      (this.processingStats.successRate * 0.9 + 0.1) : 
      (this.processingStats.successRate * 0.9);
    this.processingStats.lastUpdate = Date.now();
  }

  private cacheSignal(pair: string, signal: TradingSignal) {
    this.processedSignals.set(pair, {
      timestamp: Date.now(),
      signal
    });
  }

  clearCache() {
    this.processedSignals.clear();
    console.log('🧹 Optimized signal processor cache cleared');
  }

  getProcessingStats() {
    return {
      ...this.processingStats,
      cacheSize: this.processedSignals.size
    };
  }
}

export const optimizedSignalProcessor = new OptimizedSignalProcessor();
