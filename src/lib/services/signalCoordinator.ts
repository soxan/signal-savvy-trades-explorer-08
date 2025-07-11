
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
    // Remove the restrictive processing check that was blocking signals
    const now = Date.now();
    
    // Only block if we just processed the same pair within 30 seconds (much more lenient)
    const lastProcessed = this.lastProcessedSignals.get(pair);
    if (lastProcessed && (now - lastProcessed.timestamp) < 30000) {
      console.log(`⏸️ Recently processed ${pair} within 30s, allowing but not saving`);
      return {
        signal,
        shouldSave: false,
        shouldTrack: false,
        processingReason: 'Recent duplicate - display only'
      };
    }

    // Enhanced signal validation with more lenient criteria
    if (!this.isValidSignal(signal, pair)) {
      console.log(`❌ Signal failed validation for ${pair}`);
      return null;
    }

    // Always save valid signals that aren't NEUTRAL
    const shouldSave = signal.type !== 'NEUTRAL' && signal.confidence > 0.03;
    const shouldTrack = signal.confidence > 0.05;

    // Update tracking
    this.lastProcessedSignals.set(pair, { signal, timestamp: now });

    console.log(`✅ Signal coordinator approved for ${pair}: ${signal.type} (${(signal.confidence * 100).toFixed(1)}%)`);

    return {
      signal,
      shouldSave,
      shouldTrack,
      processingReason: shouldSave ? 'High quality signal' : 'Informational signal'
    };
  }

  private isValidSignal(signal: TradingSignal, pair: string): boolean {
    // Much more lenient validation
    if (!signal || typeof signal.confidence !== 'number') {
      return false;
    }

    // Very low confidence threshold to allow more signals through
    if (signal.confidence < 0.01) {
      console.log(`⚠️ Signal confidence too low: ${(signal.confidence * 100).toFixed(2)}%`);
      return false;
    }

    // Basic price validation
    if (signal.entry <= 0) {
      console.log(`⚠️ Invalid entry price for ${pair}`);
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
