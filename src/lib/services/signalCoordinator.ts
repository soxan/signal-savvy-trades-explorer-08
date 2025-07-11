
import { TradingSignal } from '../technicalAnalysis';

export interface CoordinatorResult {
  signal: TradingSignal;
  shouldSave: boolean;
  shouldTrack: boolean;
  processingReason: string;
}

export class SignalCoordinator {
  private processingPairs = new Set<string>();
  private lastProcessedSignals = new Map<string, { signal: TradingSignal; timestamp: number }>();

  async processSignal(signal: TradingSignal, pair: string): Promise<CoordinatorResult | null> {
    const now = Date.now();
    
    // Much more lenient cooldown - only 30 seconds to allow frequent updates
    const lastProcessed = this.lastProcessedSignals.get(pair);
    if (lastProcessed && (now - lastProcessed.timestamp) < 30000) {
      console.log(`⏸️ Recently processed ${pair} within 30 seconds, allowing but not saving`);
      // Still return the signal for display, just don't save it
      return {
        signal,
        shouldSave: false,
        shouldTrack: false,
        processingReason: 'Recent duplicate - display only'
      };
    }

    // Very lenient signal validation
    if (!this.isValidSignal(signal, pair)) {
      console.log(`❌ Signal failed basic validation for ${pair}`);
      return null;
    }

    // Much more permissive saving - save almost everything except very low confidence neutral signals
    const shouldSave = signal.type !== 'NEUTRAL' || signal.confidence > 0.02;
    const shouldTrack = signal.confidence > 0.03; // Very low threshold

    // Update tracking
    this.lastProcessedSignals.set(pair, { signal, timestamp: now });

    console.log(`✅ Signal coordinator approved for ${pair}: ${signal.type} (${(signal.confidence * 100).toFixed(1)}%)`);

    return {
      signal,
      shouldSave,
      shouldTrack,
      processingReason: shouldSave ? 'Signal accepted' : 'Low confidence neutral signal'
    };
  }

  private isValidSignal(signal: TradingSignal, pair: string): boolean {
    // Very basic validation only
    if (!signal || typeof signal.confidence !== 'number') {
      return false;
    }

    // Very low confidence threshold
    if (signal.confidence < 0.01) {
      console.log(`⚠️ Signal confidence too low: ${(signal.confidence * 100).toFixed(2)}%`);
      return false;
    }

    // Basic price validation
    if (signal.entry <= 0) {
      console.log(`⚠️ Invalid entry price for ${pair}`);
      return false;
    }

    // Very lenient risk/reward validation
    if (signal.riskReward < 0.1) {
      console.log(`⚠️ Very poor risk/reward ratio: ${signal.riskReward.toFixed(2)} for ${pair}`);
      return false;
    }

    return true;
  }

  clearProcessingState() {
    this.processingPairs.clear();
    this.lastProcessedSignals.clear();
    console.log('🧹 Signal coordinator state cleared');
  }

  getProcessingStats() {
    return {
      activePairs: Array.from(this.processingPairs),
      recentSignals: this.lastProcessedSignals.size,
      lastProcessedPairs: Array.from(this.lastProcessedSignals.keys())
    };
  }
}

export const signalCoordinator = new SignalCoordinator();
