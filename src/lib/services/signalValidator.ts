
import { TradingSignal } from '../technicalAnalysis';
import { signalDuplicateDetector } from '../utils/signalDuplicateDetector';

export class SignalValidator {
  private pairSignalCounts = new Map<string, number>();
  private lastValidationTime = new Map<string, number>();

  validateSignal(signal: TradingSignal, pair: string): boolean {
    const now = Date.now();
    
    // Very lenient rate limiting: max 1 signal per pair per 30 seconds
    const lastValidation = this.lastValidationTime.get(pair);
    if (lastValidation && (now - lastValidation) < 30000) {
      console.log(`⏳ Rate limit: ${pair} validation too frequent (less than 30 seconds)`);
      return false;
    }

    // Very lenient confidence validation
    const minConfidence = this.getMinimumConfidence(signal, pair);
    if (signal.confidence < minConfidence) {
      console.log(`❌ Signal confidence ${(signal.confidence * 100).toFixed(2)}% below minimum ${(minConfidence * 100).toFixed(2)}% for ${pair}`);
      return false;
    }

    // Very lenient risk/reward validation
    const minRiskReward = 0.05; // Extremely low threshold
    if (signal.riskReward < minRiskReward) {
      console.log(`❌ Risk/reward ratio ${signal.riskReward.toFixed(2)} below minimum ${minRiskReward} for ${pair}`);
      return false;
    }

    // Basic price validation only
    if (signal.entry <= 0) {
      console.log(`❌ Invalid entry price for ${pair}`);
      return false;
    }

    // Update validation tracking
    this.lastValidationTime.set(pair, now);
    this.pairSignalCounts.set(pair, (this.pairSignalCounts.get(pair) || 0) + 1);

    console.log(`✅ Signal validation passed for ${pair}: ${signal.type} at ${(signal.confidence * 100).toFixed(2)}% confidence`);
    return true;
  }

  private getMinimumConfidence(signal: TradingSignal, pair: string): number {
    // Extremely lenient base threshold
    let threshold = 0.01; // Very low base threshold
    
    // Adjust based on signal type
    if (signal.type === 'NEUTRAL') {
      threshold = 0.005; // Even lower for neutral signals
    } else {
      threshold = 0.015; // Still very low for actionable signals
    }
    
    // Further reduce threshold if patterns are present
    if (signal.patterns.length >= 1) {
      threshold *= 0.5; // Halve the requirement if patterns exist
    }
    
    return Math.max(threshold, 0.005); // Absolute minimum of 0.5%
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

export const signalValidator = new SignalValidator();
