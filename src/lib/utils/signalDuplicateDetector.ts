
import { TradingSignal } from '../technicalAnalysis';

interface SignalFingerprint {
  pair: string;
  type: string;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

export class SignalDuplicateDetector {
  private static instance: SignalDuplicateDetector;
  private signalFingerprints = new Map<string, SignalFingerprint>();
  private recentSignals = new Map<string, { signal: TradingSignal; timestamp: number }>();
  private pairCooldowns = new Map<string, number>();

  static getInstance(): SignalDuplicateDetector {
    if (!SignalDuplicateDetector.instance) {
      SignalDuplicateDetector.instance = new SignalDuplicateDetector();
    }
    return SignalDuplicateDetector.instance;
  }

  private generateSignalFingerprint(signal: TradingSignal, pair: string): string {
    return `${pair}_${signal.type}_${Math.round(signal.confidence * 100)}_${signal.entry.toFixed(4)}`;
  }

  isDuplicate(newSignal: TradingSignal, pair: string): boolean {
    const now = Date.now();
    
    // Check pair-specific cooldown (enhanced from 30s to 5 minutes for same pair)
    const lastSignalTime = this.pairCooldowns.get(pair);
    if (lastSignalTime && (now - lastSignalTime) < 300000) { // 5 minutes cooldown
      console.log(`🔄 PAIR COOLDOWN: ${pair} still in cooldown for ${Math.round((300000 - (now - lastSignalTime)) / 1000)}s`);
      return true;
    }
    
    const fingerprint = this.generateSignalFingerprint(newSignal, pair);
    
    // Check exact fingerprint match within 15 minutes (enhanced from 5 minutes)
    const existingFingerprint = this.signalFingerprints.get(fingerprint);
    if (existingFingerprint && (now - existingFingerprint.timestamp) < 900000) {
      console.log(`🔄 EXACT DUPLICATE detected for ${pair}: ${fingerprint}`);
      return true;
    }
    
    // Check similar signals with stricter criteria
    const recentSignal = this.recentSignals.get(pair);
    if (recentSignal) {
      const timeDiff = now - recentSignal.timestamp;
      const isSameType = newSignal.type === recentSignal.signal.type;
      const confidenceDiff = Math.abs(newSignal.confidence - recentSignal.signal.confidence);
      const priceDiff = Math.abs(newSignal.entry - recentSignal.signal.entry) / recentSignal.signal.entry;
      
      // Much stricter duplicate detection - within 2 minutes for same type
      if (timeDiff < 120000 && isSameType) {
        console.log(`🔄 SAME TYPE DUPLICATE detected for ${pair} within ${(timeDiff/1000).toFixed(1)}s`);
        return true;
      }
      
      // Very similar signals within 5 minutes
      if (timeDiff < 300000 && isSameType && confidenceDiff < 0.05 && priceDiff < 0.002) {
        console.log(`🔄 SIMILAR DUPLICATE detected for ${pair} within ${(timeDiff/1000).toFixed(1)}s`);
        return true;
      }
    }
    
    return false;
  }

  recordSignal(signal: TradingSignal, pair: string): boolean {
    if (this.isDuplicate(signal, pair)) {
      return false;
    }
    
    const fingerprint = this.generateSignalFingerprint(signal, pair);
    const now = Date.now();
    
    // Store fingerprint with longer retention
    this.signalFingerprints.set(fingerprint, {
      pair,
      type: signal.type,
      confidence: signal.confidence,
      entry: signal.entry,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      timestamp: now
    });
    
    // Update recent signal and cooldown
    this.recentSignals.set(pair, { signal, timestamp: now });
    this.pairCooldowns.set(pair, now);
    
    console.log(`✅ RECORDED new signal for ${pair}: ${fingerprint}`);
    return true;
  }

  clearCache() {
    const now = Date.now();
    let cleared = 0;
    
    // Clear old fingerprints (older than 2 hours)
    for (const [key, value] of this.signalFingerprints.entries()) {
      if (now - value.timestamp > 7200000) {
        this.signalFingerprints.delete(key);
        cleared++;
      }
    }
    
    // Clear old recent signals (older than 30 minutes)  
    for (const [key, value] of this.recentSignals.entries()) {
      if (now - value.timestamp > 1800000) {
        this.recentSignals.delete(key);
      }
    }
    
    // Clear old cooldowns (older than 30 minutes)
    for (const [key, value] of this.pairCooldowns.entries()) {
      if (now - value > 1800000) {
        this.pairCooldowns.delete(key);
      }
    }
    
    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} old signal fingerprints`);
    }
  }

  getStats() {
    return {
      totalFingerprints: this.signalFingerprints.size,
      recentSignals: this.recentSignals.size,
      activeCooldowns: this.pairCooldowns.size
    };
  }

  // Force clear cooldown for a specific pair (useful for testing)
  clearPairCooldown(pair: string) {
    this.pairCooldowns.delete(pair);
    console.log(`🧹 Cleared cooldown for ${pair}`);
  }
}

export const signalDuplicateDetector = SignalDuplicateDetector.getInstance();
