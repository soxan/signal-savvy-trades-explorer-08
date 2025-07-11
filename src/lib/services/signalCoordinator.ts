
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
    
    // Increased cooldown to 5 minutes for the same pair to prevent rapid-fire signals
    const lastProcessed = this.lastProcessedSignals.get(pair);
    if (lastProcessed && (now - lastProcessed.timestamp) < 300000) {
      console.log(`⏸️ Recently processed ${pair} within 5 minutes, blocking duplicate`);
      return null;
    }

    // Enhanced signal validation with stricter criteria
    if (!this.isValidSignal(signal, pair)) {
      console.log(`❌ Signal failed validation for ${pair}`);
      return null;
    }

    // More selective saving - only save high-confidence, non-neutral signals
    const shouldSave = signal.type !== 'NEUTRAL' && signal.confidence > 0.08; // Increased threshold
    const shouldTrack = signal.confidence > 0.10; // Increased threshold

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
    // Stricter validation
    if (!signal || typeof signal.confidence !== 'number') {
      return false;
    }

    // Higher confidence threshold to reduce noise
    if (signal.confidence < 0.05) {
      console.log(`⚠️ Signal confidence too low: ${(signal.confidence * 100).toFixed(2)}%`);
      return false;
    }

    // Basic price validation
    if (signal.entry <= 0) {
      console.log(`⚠️ Invalid entry price for ${pair}`);
      return false;
    }

    // Check for reasonable risk/reward ratio
    if (signal.riskReward < 0.5) {
      console.log(`⚠️ Poor risk/reward ratio: ${signal.riskReward.toFixed(2)} for ${pair}`);
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
