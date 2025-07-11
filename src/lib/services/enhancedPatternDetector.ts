
import { CandlestickData, TradingSignal } from '../technicalAnalysis';

export interface EnhancedPattern {
  name: string;
  type: 'BUY' | 'SELL';
  confidence: number;
  strength: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
}

export class EnhancedPatternDetector {
  detectAllPatterns(data: CandlestickData[]): EnhancedPattern[] {
    if (data.length < 5) return [];

    const patterns: EnhancedPattern[] = [];
    const latest = data[data.length - 1];
    const prev = data[data.length - 2];
    const prev2 = data[data.length - 3];

    // Ultra-aggressive pattern detection - catch every possible bullish signal
    patterns.push(...this.detectEngulfingPatterns(data));
    patterns.push(...this.detectDojiPatterns(data));
    patterns.push(...this.detectHammerPatterns(data));
    patterns.push(...this.detectTrendPatterns(data));
    patterns.push(...this.detectBreakoutPatterns(data));
    patterns.push(...this.detectMomentumPatterns(data));
    patterns.push(...this.detectBullishRejectionPatterns(data)); // New aggressive patterns
    patterns.push(...this.detectMinorBullishPatterns(data)); // New minor pattern detection

    return patterns.filter(p => p.confidence > 0.2); // Very low threshold to catch more
  }

  private detectEngulfingPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    if (data.length < 2) return patterns;

    const current = data[data.length - 1];
    const prev = data[data.length - 2];

    // Ultra-bullish Engulfing - much more lenient criteria
    if (prev.close < prev.open && current.close > current.open) {
      const prevBody = Math.abs(prev.close - prev.open);
      const currentBody = Math.abs(current.close - current.open);
      
      // Much more lenient: even 50% engulfing counts
      if (current.open <= prev.close * 1.002 && current.close > prev.open * 0.998 && currentBody > prevBody * 0.5) {
        const confidence = Math.min(0.85 + (currentBody / prevBody - 0.5) * 0.1, 0.95);
        patterns.push({
          name: 'Ultra-Bullish Engulfing',
          type: 'BUY',
          confidence,
          strength: confidence * 100,
          entry: current.close,
          stopLoss: current.low * 0.990, // Tighter stops for more signals
          takeProfit: current.close * 1.030, // Higher targets
          riskReward: (current.close * 1.030 - current.close) / (current.close - current.low * 0.990)
        });
      }
    }

    // Bearish Engulfing - less generous
    if (prev.close > prev.open && current.close < current.open) {
      const prevBody = Math.abs(prev.close - prev.open);
      const currentBody = Math.abs(current.close - current.open);
      
      if (current.open >= prev.close * 0.999 && current.close < prev.open * 1.001 && currentBody > prevBody * 0.7) {
        const confidence = Math.min(0.65 + (currentBody / prevBody - 0.7) * 0.1, 0.85);
        patterns.push({
          name: 'Bearish Engulfing',
          type: 'SELL',
          confidence,
          strength: confidence * 100,
          entry: current.close,
          stopLoss: current.high * 1.012,
          takeProfit: current.close * 0.978,
          riskReward: (current.close - current.close * 0.978) / (current.high * 1.012 - current.close)
        });
      }
    }

    return patterns;
  }

  private detectDojiPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    const current = data[data.length - 1];
    
    const bodySize = Math.abs(current.close - current.open);
    const totalRange = current.high - current.low;
    const bodyRatio = bodySize / totalRange;

    // Ultra-aggressive Doji detection
    if (bodyRatio < 0.25 && totalRange > 0) { // Much more lenient
      const upperShadow = current.high - Math.max(current.open, current.close);
      const lowerShadow = Math.min(current.open, current.close) - current.low;
      
      // Ultra-bullish Dragonfly Doji
      if (lowerShadow > upperShadow * 1.5 && lowerShadow > totalRange * 0.3) { // Much more lenient
        patterns.push({
          name: 'Ultra-Bullish Dragonfly Doji',
          type: 'BUY',
          confidence: 0.75, // Higher base confidence
          strength: 75,
          entry: current.close,
          stopLoss: current.low * 0.992,
          takeProfit: current.close * 1.025,
          riskReward: (current.close * 1.025 - current.close) / (current.close - current.low * 0.992)
        });
      }
      
      // Gravestone Doji - less generous
      if (upperShadow > lowerShadow * 2 && upperShadow > totalRange * 0.5) {
        patterns.push({
          name: 'Gravestone Doji',
          type: 'SELL',
          confidence: 0.55,
          strength: 55,
          entry: current.close,
          stopLoss: current.high * 1.008,
          takeProfit: current.close * 0.985,
          riskReward: (current.close - current.close * 0.985) / (current.high * 1.008 - current.close)
        });
      }
    }

    return patterns;
  }

  private detectHammerPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    const current = data[data.length - 1];
    
    const bodySize = Math.abs(current.close - current.open);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);

    // Ultra-bullish Hammer - much more lenient
    if (lowerShadow > bodySize * 1.0 && upperShadow < bodySize * 0.8) { // Much more lenient
      patterns.push({
        name: 'Ultra-Bullish Hammer',
        type: 'BUY',
        confidence: 0.70, // Higher confidence
        strength: 70,
        entry: current.close,
        stopLoss: current.low * 0.997,
        takeProfit: current.close * 1.020,
        riskReward: (current.close * 1.020 - current.close) / (current.close - current.low * 0.997)
      });
    }

    // Shooting Star - less generous
    if (upperShadow > bodySize * 1.8 && lowerShadow < bodySize * 0.3) {
      patterns.push({
        name: 'Shooting Star',
        type: 'SELL',
        confidence: 0.50,
        strength: 50,
        entry: current.close,
        stopLoss: current.high * 1.003,
        takeProfit: current.close * 0.990,
        riskReward: (current.close - current.close * 0.990) / (current.high * 1.003 - current.close)
      });
    }

    return patterns;
  }

  private detectTrendPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    if (data.length < 5) return patterns;

    const recent = data.slice(-5);
    const closes = recent.map(d => d.close);
    const trend = this.calculateTrend(closes);

    // Ultra-aggressive trend detection
    if (Math.abs(trend) > 0.002) { // Much lower threshold: 0.2% trend
      const current = data[data.length - 1];
      
      if (trend > 0) {
        patterns.push({
          name: 'Strong Bullish Trend',
          type: 'BUY',
          confidence: Math.min(0.70 + Math.abs(trend) * 15, 0.90), // Higher base confidence
          strength: Math.min(70 + Math.abs(trend) * 1500, 90),
          entry: current.close,
          stopLoss: current.close * 0.985,
          takeProfit: current.close * 1.030,
          riskReward: (current.close * 1.030 - current.close) / (current.close - current.close * 0.985)
        });
      } else {
        patterns.push({
          name: 'Downtrend Continuation',
          type: 'SELL',
          confidence: Math.min(0.50 + Math.abs(trend) * 10, 0.75), // Less generous for sells
          strength: Math.min(50 + Math.abs(trend) * 1000, 75),
          entry: current.close,
          stopLoss: current.close * 1.015,
          takeProfit: current.close * 0.980,
          riskReward: (current.close - current.close * 0.980) / (current.close * 1.015 - current.close)
        });
      }
    }

    return patterns;
  }

  private detectBreakoutPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    if (data.length < 10) return patterns;

    const recent = data.slice(-10);
    const current = data[data.length - 1];
    const resistance = Math.max(...recent.map(d => d.high));
    const support = Math.min(...recent.map(d => d.low));
    const midpoint = (resistance + support) / 2;

    // Ultra-aggressive breakout detection
    if (current.close > resistance * 1.0005) { // Much lower threshold: 0.05%
      patterns.push({
        name: 'Ultra-Bullish Breakout',
        type: 'BUY',
        confidence: 0.80, // High confidence for breakouts
        strength: 80,
        entry: current.close,
        stopLoss: resistance * 0.999,
        takeProfit: current.close * 1.035,
        riskReward: (current.close * 1.035 - current.close) / (current.close - resistance * 0.999)
      });
    }

    // Breakdown below support - less generous
    if (current.close < support * 0.9995) {
      patterns.push({
        name: 'Support Breakdown',
        type: 'SELL',
        confidence: 0.60,
        strength: 60,
        entry: current.close,
        stopLoss: support * 1.001,
        takeProfit: current.close * 0.975,
        riskReward: (current.close - current.close * 0.975) / (support * 1.001 - current.close)
      });
    }

    return patterns;
  }

  private detectMomentumPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    if (data.length < 3) return patterns;

    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    const momentum = (current.close - prev.close) / prev.close;

    // Ultra-aggressive bullish momentum - much lower threshold
    if (momentum > 0.003) { // 0.3% move (was 1%)
      patterns.push({
        name: 'Ultra-Strong Bullish Momentum',
        type: 'BUY',
        confidence: Math.min(0.70 + momentum * 25, 0.90), // Higher base confidence
        strength: Math.min(70 + momentum * 2500, 90),
        entry: current.close,
        stopLoss: current.close * 0.990,
        takeProfit: current.close * 1.025,
        riskReward: (current.close * 1.025 - current.close) / (current.close - current.close * 0.990)
      });
    }

    // Bearish momentum - less generous
    if (momentum < -0.008) { // Higher threshold for bearish
      patterns.push({
        name: 'Bearish Momentum',
        type: 'SELL',
        confidence: Math.min(0.50 + Math.abs(momentum) * 15, 0.75),
        strength: Math.min(50 + Math.abs(momentum) * 1500, 75),
        entry: current.close,
        stopLoss: current.close * 1.012,
        takeProfit: current.close * 0.985,
        riskReward: (current.close - current.close * 0.985) / (current.close * 1.012 - current.close)
      });
    }

    return patterns;
  }

  // New ultra-aggressive pattern detectors for bullish market
  private detectBullishRejectionPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    if (data.length < 3) return patterns;

    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    
    // Detect any form of bullish rejection/reversal
    if (current.low < prev.low && current.close > current.open && current.close > prev.close) {
      patterns.push({
        name: 'Bullish Rejection Pattern',
        type: 'BUY',
        confidence: 0.65,
        strength: 65,
        entry: current.close,
        stopLoss: current.low * 0.995,
        takeProfit: current.close * 1.022,
        riskReward: (current.close * 1.022 - current.close) / (current.close - current.low * 0.995)
      });
    }

    return patterns;
  }

  private detectMinorBullishPatterns(data: CandlestickData[]): EnhancedPattern[] {
    const patterns: EnhancedPattern[] = [];
    if (data.length < 2) return patterns;

    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    
    // Any green candle after red candle
    if (prev.close < prev.open && current.close > current.open) {
      patterns.push({
        name: 'Basic Bullish Reversal',
        type: 'BUY',
        confidence: 0.45,
        strength: 45,
        entry: current.close,
        stopLoss: current.close * 0.992,
        takeProfit: current.close * 1.018,
        riskReward: (current.close * 1.018 - current.close) / (current.close - current.close * 0.992)
      });
    }

    // Higher high, higher close
    if (current.high > prev.high && current.close > prev.close) {
      patterns.push({
        name: 'Bullish Higher High',
        type: 'BUY',
        confidence: 0.55,
        strength: 55,
        entry: current.close,
        stopLoss: current.close * 0.990,
        takeProfit: current.close * 1.020,
        riskReward: (current.close * 1.020 - current.close) / (current.close - current.close * 0.990)
      });
    }

    return patterns;
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    let sum = 0;
    for (let i = 1; i < prices.length; i++) {
      sum += (prices[i] - prices[i-1]) / prices[i-1];
    }
    
    return sum / (prices.length - 1);
  }
}

export const enhancedPatternDetector = new EnhancedPatternDetector();
