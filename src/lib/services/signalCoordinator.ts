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
  private signalTypeHistory = new Map<string, string[]>(); // Track recent signal types per pair

  async processSignal(signal: TradingSignal, pair: string): Promise<CoordinatorResult | null> {
    const now = Date.now();
    
    // Balanced cooldown - 2 minutes to prevent spam but allow reasonable updates
    const lastProcessed = this.lastProcessedSignals.get(pair);
    if (lastProcessed && (now - lastProcessed.timestamp) < 120000) {
      console.log(`⏸️ Recently processed ${pair} within 2 minutes, skipping`);
      return null;
    }

    // Basic signal validation
    if (!this.isValidSignal(signal, pair)) {
      console.log(`❌ Signal failed basic validation for ${pair}`);
      return null;
    }

    // Check for signal diversity (prevent too many consecutive signals of same type)
    if (!this.checkSignalDiversity(signal, pair)) {
      console.log(`🔄 Signal diversity check failed for ${pair} - too many consecutive ${signal.type} signals`);
      return {
        signal,
        shouldSave: false,
        shouldTrack: false,
        processingReason: 'Signal diversity filter - too many consecutive signals of same type'
      };
    }

    // Balanced saving criteria
    const shouldSave = this.shouldSaveSignal(signal);
    const shouldTrack = signal.confidence > 0.15; // Reasonable tracking threshold

    // Update tracking
    this.lastProcessedSignals.set(pair, { signal, timestamp: now });
    this.updateSignalTypeHistory(signal, pair);

    console.log(`✅ Signal coordinator approved for ${pair}: ${signal.type} (${(signal.confidence * 100).toFixed(1)}%)`);

    return {
      signal,
      shouldSave,
      shouldTrack,
      processingReason: shouldSave ? 'Signal accepted' : 'Low confidence signal - display only'
    };
  }

  private isValidSignal(signal: TradingSignal, pair: string): boolean {
    // Basic validation
    if (!signal || typeof signal.confidence !== 'number') {
      return false;
    }

    // Minimum confidence threshold
    if (signal.confidence < 0.05) {
      console.log(`⚠️ Signal confidence too low: ${(signal.confidence * 100).toFixed(2)}%`);
      return false;
    }

    // Basic price validation
    if (signal.entry <= 0) {
      console.log(`⚠️ Invalid entry price for ${pair}`);
      return false;
    }

    // Risk/reward validation
    if (signal.riskReward < 0.3) {
      console.log(`⚠️ Poor risk/reward ratio: ${signal.riskReward.toFixed(2)} for ${pair}`);
      return false;
    }

    return true;
  }

  private shouldSaveSignal(signal: TradingSignal): boolean {
    // Save criteria based on signal quality
    if (signal.type === 'NEUTRAL') {
      return signal.confidence > 0.1; // Higher threshold for neutral signals
    }
    
    // For BUY/SELL signals
    return signal.confidence > 0.08 && signal.riskReward > 0.5;
  }

  private checkSignalDiversity(signal: TradingSignal, pair: string): boolean {
    const history = this.signalTypeHistory.get(pair) || [];
    
    // Allow signal if history is short
    if (history.length < 3) return true;
    
    // Check last 3 signals - if all are the same type, reject this one if it's also the same
    const lastThree = history.slice(-3);
    const allSameType = lastThree.every(type => type === signal.type);
    
    if (allSameType && signal.type !== 'NEUTRAL') {
      return false; // Reject if last 3 were same type and this one is too
    }
    
    return true;
  }

  private updateSignalTypeHistory(signal: TradingSignal, pair: string): void {
    const history = this.signalTypeHistory.get(pair) || [];
    history.push(signal.type);
    
    // Keep only last 5 signals
    if (history.length > 5) {
      history.shift();
    }
    
    this.signalTypeHistory.set(pair, history);
  }

  clearProcessingState() {
    this.processingPairs.clear();
    this.lastProcessedSignals.clear();
    this.signalTypeHistory.clear();
    console.log('🧹 Signal coordinator state cleared');
  }

  getProcessingStats() {
    return {
      activePairs: Array.from(this.processingPairs),
      recentSignals: this.lastProcessedSignals.size,
      lastProcessedPairs: Array.from(this.lastProcessedSignals.keys()),
      signalTypeStats: Object.fromEntries(this.signalTypeHistory)
    };
  }
}

export const signalCoordinator = new SignalCoordinator();
