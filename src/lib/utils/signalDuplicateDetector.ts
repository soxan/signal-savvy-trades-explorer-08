
import { TradingSignal } from '../technicalAnalysis';

export class SignalDuplicateDetector {
  private signalHistory = new Map<string, Array<{ signal: TradingSignal; timestamp: number }>>();

  isDuplicate(signal: TradingSignal, pair: string): boolean {
    const now = Date.now();
    const pairHistory = this.signalHistory.get(pair) || [];
    
    // Clean old entries (increased to 30 minutes for better duplicate detection)
    const recentHistory = pairHistory.filter(entry => (now - entry.timestamp) < 1800000);
    this.signalHistory.set(pair, recentHistory);
    
    // More aggressive duplicate detection
    const isDuplicate = recentHistory.some(entry => 
      entry.signal.type === signal.type &&
      Math.abs(entry.signal.confidence - signal.confidence) < 0.15 && // Increased threshold
      Math.abs(entry.signal.entry - signal.entry) < (signal.entry * 0.005) // Increased to 0.5% price difference
    );
    
    return isDuplicate;
  }

  recordSignal(signal: TradingSignal, pair: string): boolean {
    if (this.isDuplicate(signal, pair)) {
      console.log(`🔄 Duplicate signal detected for ${pair} - Type: ${signal.type}, Confidence: ${(signal.confidence * 100).toFixed(1)}%, skipping`);
      return false;
    }

    // Add to history
    const now = Date.now();
    const pairHistory = this.signalHistory.get(pair) || [];
    pairHistory.push({ signal: { ...signal }, timestamp: now });
    this.signalHistory.set(pair, pairHistory);
    
    console.log(`✅ Signal recorded for ${pair} - Type: ${signal.type}, Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
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
