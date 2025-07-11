
import { TradingSignal } from '../technicalAnalysis';
import { signalDuplicateDetector } from '../utils/signalDuplicateDetector';

export class SignalValidator {
  private pairSignalCounts = new Map<string, number>();
  private lastValidationTime = new Map<string, number>();

  validateSignal(signal: TradingSignal, pair: string): boolean {
    const now = Date.now();
    
    // Check for duplicates first using enhanced detector
    if (signalDuplicateDetector.isDuplicate(signal, pair)) {
      console.log(`🔄 Duplicate signal rejected by validator for ${pair}`);
      return false;
    }

    // Rate limiting: max 1 signal per pair per 5 minutes
    const lastValidation = this.lastValidationTime.get(pair);
    if (lastValidation && (now - lastValidation) < 300000) {
      console.log(`⏳ Rate limit: ${pair} validation too frequent`);
      return false;
    }

    // Enhanced confidence validation with dynamic thresholds
    const minConfidence = this.getMinimumConfidence(signal, pair);
    if (signal.confidence < minConfidence) {
      console.log(`❌ Signal confidence ${(signal.confidence * 100).toFixed(2)}% below minimum ${(minConfidence * 100).toFixed(2)}% for ${pair}`);
      return false;
    }

    // Stricter risk/reward validation
    const minRiskReward = 0.5; // Increased from 0.2
    if (signal.riskReward < minRiskReward) {
      console.log(`❌ Risk/reward ratio ${signal.riskReward.toFixed(2)} below minimum ${minRiskReward} for ${pair}`);
      return false;
    }

    // Enhanced price validation
    if (!this.validatePriceLevels(signal, pair)) {
      return false;
    }

    // Pattern quality validation
    if (!this.validatePatternQuality(signal, pair)) {
      return false;
    }

    // Update validation tracking
    this.lastValidationTime.set(pair, now);
    this.pairSignalCounts.set(pair, (this.pairSignalCounts.get(pair) || 0) + 1);

    console.log(`✅ Enhanced signal validation passed for ${pair}: ${signal.type} at ${(signal.confidence * 100).toFixed(2)}% confidence`);
    return true;
  }

  private getMinimumConfidence(signal: TradingSignal, pair: string): number {
    // Base threshold - much stricter
    let threshold = 0.15; // Increased from 0.003
    
    // Adjust based on signal type
    if (signal.type === 'NEUTRAL') {
      threshold = 0.08; // Lower for neutral signals
    } else {
      threshold = 0.25; // Higher for actionable signals
    }
    
    // Adjust based on pair volatility
    if (pair === 'BTC/USDT') {
      threshold *= 1.2; // Higher threshold for BTC
    } else if (['ETH/USDT', 'SOL/USDT'].includes(pair)) {
      threshold *= 1.1;
    }
    
    // Reduce threshold if strong patterns are present
    if (signal.patterns.length >= 2) {
      threshold *= 0.8;
    } else if (signal.patterns.length === 1) {
      threshold *= 0.9;
    }
    
    return Math.max(threshold, 0.1); // Absolute minimum of 10%
  }

  private validatePriceLevels(signal: TradingSignal, pair: string): boolean {
    if (signal.entry <= 0 || signal.stopLoss <= 0 || signal.takeProfit <= 0) {
      console.log(`❌ Invalid price levels detected for ${pair}`);
      return false;
    }

    const entryPrice = signal.entry;
    
    if (signal.type === 'BUY') {
      const minTpDistance = entryPrice * 0.005; // 0.5% minimum
      const maxSlDistance = entryPrice * 0.03; // 3% maximum
      
      if (signal.takeProfit <= entryPrice + minTpDistance) {
        console.log(`❌ BUY signal take profit too close to entry for ${pair}`);
        return false;
      }
      if (signal.stopLoss >= entryPrice || (entryPrice - signal.stopLoss) > maxSlDistance) {
        console.log(`❌ BUY signal stop loss invalid for ${pair}`);
        return false;
      }
    } else if (signal.type === 'SELL') {
      const minTpDistance = entryPrice * 0.005;
      const maxSlDistance = entryPrice * 0.03;
      
      if (signal.takeProfit >= entryPrice - minTpDistance) {
        console.log(`❌ SELL signal take profit too close to entry for ${pair}`);
        return false;
      }
      if (signal.stopLoss <= entryPrice || (signal.stopLoss - entryPrice) > maxSlDistance) {
        console.log(`❌ SELL signal stop loss invalid for ${pair}`);
        return false;
      }
    }

    return true;
  }

  private validatePatternQuality(signal: TradingSignal, pair: string): boolean {
    // Require at least one pattern for high-confidence signals
    if (signal.confidence > 0.6 && signal.patterns.length === 0) {
      console.log(`❌ High confidence signal without patterns for ${pair}`);
      return false;
    }

    // Check for conflicting patterns
    const buyPatterns = signal.patterns.filter(p => 
      p.includes('Bullish') || p.includes('Hammer') || p.includes('Dragonfly')
    );
    const sellPatterns = signal.patterns.filter(p => 
      p.includes('Bearish') || p.includes('Shooting') || p.includes('Gravestone')
    );

    if (buyPatterns.length > 0 && sellPatterns.length > 0) {
      console.log(`❌ Conflicting patterns detected for ${pair}`);
      return false;
    }

    return true;
  }

  clearCache() {
    signalDuplicateDetector.clearCache();
    this.pairSignalCounts.clear();
    this.lastValidationTime.clear();
    console.log('🧹 Signal validator cache cleared');
  }

  getValidationStats() {
    return {
      pairCounts: Object.fromEntries(this.pairSignalCounts),
      totalPairs: this.pairSignalCounts.size,
      duplicateDetectorStats: signalDuplicateDetector.getStats()
    };
  }
}
