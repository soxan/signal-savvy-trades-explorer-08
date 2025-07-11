
import { TradingSignal } from '../technicalAnalysis';
import { signalDuplicateDetector } from '../utils/signalDuplicateDetector';
import { SignalValidator } from './signalValidator';

export interface SignalProcessingResult {
  signal: TradingSignal;
  pair: string;
  timestamp: number;
  id: string;
  shouldSave: boolean;
  shouldTrack: boolean;
  processingReason: string;
}

class SignalCoordinator {
  private static instance: SignalCoordinator;
  private processingSignals = new Set<string>();
  private signalValidator = new SignalValidator();
  private processingCounts = new Map<string, number>();
  
  static getInstance(): SignalCoordinator {
    if (!SignalCoordinator.instance) {
      SignalCoordinator.instance = new SignalCoordinator();
    }
    return SignalCoordinator.instance;
  }

  async processSignal(signal: TradingSignal, pair: string): Promise<SignalProcessingResult | null> {
    const processingKey = `${pair}_${Date.now()}`;
    
    // Enhanced concurrent processing check
    if (this.processingSignals.has(pair)) {
      console.log(`⏳ Signal processing already in progress for ${pair}, rejecting`);
      return null;
    }
    
    this.processingSignals.add(pair);
    
    try {
      // Validate signal first
      if (!this.signalValidator.validateSignal(signal, pair)) {
        console.log(`❌ Signal validation failed for ${pair}`);
        return null;
      }
      
      // Check and record duplicate
      if (!signalDuplicateDetector.recordSignal(signal, pair)) {
        console.log(`🔄 Signal rejected as duplicate for ${pair}`);
        return null;
      }
      
      // Enhanced processing strategy with quality gates
      const shouldSave = this.shouldSaveSignal(signal, pair);
      const shouldTrack = this.shouldTrackSignal(signal, pair);
      
      // Update processing count
      this.processingCounts.set(pair, (this.processingCounts.get(pair) || 0) + 1);
      
      const result: SignalProcessingResult = {
        signal,
        pair,
        timestamp: Date.now(),
        id: `${pair}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        shouldSave,
        shouldTrack,
        processingReason: this.getProcessingReason(signal, shouldSave, shouldTrack, pair)
      };
      
      console.log(`🎯 COORDINATED SIGNAL for ${pair}:`, {
        type: signal.type,
        confidence: (signal.confidence * 100).toFixed(2) + '%',
        shouldSave,
        shouldTrack,
        reason: result.processingReason,
        patterns: signal.patterns.length,
        processingCount: this.processingCounts.get(pair)
      });
      
      return result;
      
    } finally {
      // Enhanced cooldown based on signal quality
      const cooldownTime = this.calculateCooldownTime(signal, pair);
      setTimeout(() => {
        this.processingSignals.delete(pair);
      }, cooldownTime);
    }
  }
  
  private shouldSaveSignal(signal: TradingSignal, pair: string): boolean {
    // Much stricter saving criteria
    if (signal.type === 'NEUTRAL') {
      return signal.confidence > 0.15 && signal.patterns.length > 0;
    }
    
    // For actionable signals
    return signal.confidence > 0.25 && 
           signal.riskReward > 0.5 &&
           signal.entry > 0 && 
           signal.stopLoss > 0 && 
           signal.takeProfit > 0 &&
           (signal.patterns.length > 0 || signal.confidence > 0.4);
  }
  
  private shouldTrackSignal(signal: TradingSignal, pair: string): boolean {
    // Track signals with reasonable quality for ML learning
    return signal.confidence > 0.1 && 
           signal.riskReward > 0.3 &&
           (signal.patterns.length > 0 || signal.confidence > 0.2);
  }
  
  private calculateCooldownTime(signal: TradingSignal, pair: string): number {
    // Base cooldown of 10 seconds
    let cooldown = 10000;
    
    // Extend cooldown based on signal quality
    if (signal.confidence > 0.5) {
      cooldown = 30000; // 30 seconds for high confidence
    } else if (signal.confidence > 0.3) {
      cooldown = 20000; // 20 seconds for medium confidence
    }
    
    // Extend cooldown for actionable signals
    if (signal.type !== 'NEUTRAL') {
      cooldown *= 2;
    }
    
    return cooldown;
  }
  
  private getProcessingReason(signal: TradingSignal, shouldSave: boolean, shouldTrack: boolean, pair: string): string {
    const processingCount = this.processingCounts.get(pair) || 0;
    
    if (signal.type === 'NEUTRAL') {
      if (shouldSave) {
        return `High-quality neutral signal saved - confidence ${(signal.confidence * 100).toFixed(2)}% (#${processingCount})`;
      }
      return `Neutral signal tracked for analysis - confidence ${(signal.confidence * 100).toFixed(2)}% (#${processingCount})`;
    }
    
    if (shouldSave && shouldTrack) {
      return `Actionable ${signal.type} signal saved & tracked - confidence ${(signal.confidence * 100).toFixed(2)}% (#${processingCount})`;
    }
    
    if (shouldTrack) {
      return `${signal.type} signal tracked for ML - confidence ${(signal.confidence * 100).toFixed(2)}% (#${processingCount})`;
    }
    
    return `${signal.type} signal processed - confidence ${(signal.confidence * 100).toFixed(2)}% (#${processingCount})`;
  }
  
  clearProcessingStates() {
    this.processingSignals.clear();
    this.processingCounts.clear();
    this.signalValidator.clearCache();
    console.log('🧹 Cleared all processing states and validator cache');
  }

  getProcessingStats() {
    return {
      activeProcessing: this.processingSignals.size,
      processingCounts: Object.fromEntries(this.processingCounts),
      validatorStats: this.signalValidator.getValidationStats()
    };
  }
}

export const signalCoordinator = SignalCoordinator.getInstance();
