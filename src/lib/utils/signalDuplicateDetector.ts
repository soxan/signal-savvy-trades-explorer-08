
import { TradingSignal } from '../technicalAnalysis';

export class SignalDuplicateDetector {
  private signalHistory = new Map<string, Array<{ signal: TradingSignal; timestamp: number }>>();

  isDuplicate(signal: TradingSignal, pair: string): boolean {
    const now = Date.now();
    const pairHistory = this.signalHistory.get(pair) || [];
    
    // Clean old entries (older than 10 minutes)
    const recentHistory = pairHistory.filter(entry => (now - entry.timestamp) < 600000);
    this.signalHistory.set(pair, recentHistory);
    
    // Check for duplicates in recent history
    const isDuplicate = recentHistory.some(entry => 
      entry.signal.type === signal.type &&
      Math.abs(entry.signal.confidence - signal.confidence) < 0.05 &&
      Math.abs(entry.signal.entry - signal.entry) < (signal.entry * 0.001) // 0.1% price difference
    );
    
    return isDuplicate;
  }

  recordSignal(signal: TradingSignal, pair: string): boolean {
    if (this.isDuplicate(signal, pair)) {
      console.log(`🔄 Duplicate signal detected for ${pair}, skipping`);
      return false;
    }

    // Add to history
    const now = Date.now();
    const pairHistory = this.signalHistory.get(pair) || [];
    pairHistory.push({ signal: { ...signal }, timestamp: now });
    this.signalHistory.set(pair, pairHistory);
    
    return true;
  }

  clearCache() {
    this.signalHistory.clear();
    console.log('🧹 Signal duplicate detector cache cleared');
  }

  getStats() {
    return {
      totalPairs: this.signalHistory.size,
      totalSignals: Array.from(this.signalHistory.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

export const signalDuplicateDetector = new SignalDuplicateDetector();
