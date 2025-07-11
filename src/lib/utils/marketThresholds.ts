import { VolumeValidation } from './volumeValidator';

export interface MarketThresholds {
  confidence: number;
  quality: number;
  riskReward: number;
  patternWeight: number;
  volumeMultiplier: number;
}

export class MarketThresholds {
  static getThresholds(
    pair: string, 
    marketCondition: string, 
    momentum: number, 
    volumeValidation: VolumeValidation
  ): MarketThresholds {
    
    // Base thresholds - much more realistic for current market
    let confidence = 0.03; // Very low base confidence threshold
    let quality = 25;      // Lower quality threshold
    let riskReward = 0.2;  // Lower risk/reward requirement
    let patternWeight = 1.0;
    let volumeMultiplier = 1.0;
    
    // Pair-specific adjustments
    switch (pair) {
      case 'BTC/USDT':
        confidence = 0.04; // Slightly higher for BTC due to importance
        quality = 30;
        break;
      case 'ETH/USDT':
        confidence = 0.035;
        quality = 28;
        break;
      case 'SOL/USDT':
      case 'AVAX/USDT':
      case 'ADA/USDT':
        confidence = 0.03;
        quality = 25;
        break;
      default:
        confidence = 0.025; // Even lower for other altcoins
        quality = 22;
    }
    
    // Market condition adjustments
    switch (marketCondition) {
      case 'HIGH_VOLATILITY':
        confidence *= 0.8; // Lower threshold in volatile markets
        quality -= 5;
        riskReward *= 0.9;
        patternWeight = 1.2; // Patterns more important in volatile markets
        break;
        
      case 'MODERATE_VOLATILITY':
        confidence *= 0.9;
        quality -= 3;
        patternWeight = 1.1;
        break;
        
      case 'LOW_VOLATILITY':
        confidence *= 1.1; // Slightly higher threshold in calm markets
        quality += 2;
        patternWeight = 0.9;
        break;
        
      case 'TRENDING':
        confidence *= 0.7; // Much lower in trending markets
        quality -= 8;
        riskReward *= 0.8;
        patternWeight = 1.3;
        break;
        
      case 'RANGING':
        confidence *= 1.2;
        quality += 5;
        riskReward *= 1.1;
        break;
    }
    
    // Momentum adjustments
    if (momentum > 2.0) { // High momentum
      confidence *= 0.8;
      quality -= 5;
      patternWeight = 1.2;
    } else if (momentum > 1.0) { // Medium momentum
      confidence *= 0.9;
      quality -= 2;
      patternWeight = 1.1;
    }
    
    // Volume-based adjustments - using correct VolumeValidation properties
    if (volumeValidation.isHigh) {
      confidence *= 0.7; // Much lower threshold with high volume
      quality -= 8;
      volumeMultiplier = 1.3;
    } else if (volumeValidation.isRealistic) {
      confidence *= 0.85;
      quality -= 3;
      volumeMultiplier = 1.1;
    } else {
      confidence *= 1.3; // Higher threshold with low volume
      quality += 10;
      volumeMultiplier = 0.8;
    }
    
    // Ensure minimum thresholds don't go too low or high
    confidence = Math.max(0.01, Math.min(confidence, 0.15)); // Between 1% and 15%
    quality = Math.max(15, Math.min(quality, 60));           // Between 15 and 60
    riskReward = Math.max(0.1, Math.min(riskReward, 1.0));   // Between 0.1 and 1.0
    
    console.log(`🎯 ADAPTIVE THRESHOLDS for ${pair}:`, {
      marketCondition,
      momentum: momentum.toFixed(2),
      volumeLevel: volumeValidation.isHigh ? 'HIGH' : volumeValidation.isRealistic ? 'REALISTIC' : 'LOW',
      thresholds: {
        confidence: (confidence * 100).toFixed(2) + '%',
        quality: quality.toFixed(0),
        riskReward: riskReward.toFixed(2),
        patternWeight: patternWeight.toFixed(2),
        volumeMultiplier: volumeMultiplier.toFixed(2)
      }
    });
    
    return {
      confidence,
      quality,
      riskReward,
      patternWeight,
      volumeMultiplier
    };
  }
  
  static getAdaptiveConfidenceThreshold(pair: string, recentSignals: any[]): number {
    if (recentSignals.length === 0) {
      return 0.03; // Default low threshold
    }
    
    const avgConfidence = recentSignals.reduce((sum, s) => 
      sum + (s.signal?.confidence || 0), 0) / recentSignals.length;
    
    const rejectionRate = recentSignals.filter(s => !s.accepted).length / recentSignals.length;
    
    let threshold = 0.03; // Base threshold
    
    // Adjust based on recent performance
    if (rejectionRate > 0.8) {
      threshold *= 0.7; // Lower threshold if too many rejections
    } else if (rejectionRate < 0.3) {
      threshold *= 1.2; // Slightly higher if accepting too many
    }
    
    // Adjust based on average confidence
    if (avgConfidence < 0.05) {
      threshold *= 0.8; // Lower if signals are generally low confidence
    }
    
    return Math.max(0.01, Math.min(threshold, 0.1));
  }
}
