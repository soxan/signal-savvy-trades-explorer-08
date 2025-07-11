
import { CandlestickData } from '../technicalAnalysis';
import { patternDetection, PatternSignal } from './patternDetection';
import { mlEnhancedSignalProcessor } from './mlEnhancedSignalProcessor';
import { riskManagement, EnhancedRiskMetrics } from './riskManagement';

export interface HighLeverageSignal {
  patternSignal: PatternSignal | null;
  mlConfidence: number;
  hybridConfidence: number;
  quickProfitPotential: number;
  riskScore: number;
  optimalLeverage: number;
  entryTiming: 'IMMEDIATE' | 'WAIT_CONFIRMATION' | 'AVOID';
  exitStrategy: {
    quickTakeProfit: number;
    stopLoss: number;
    trailingStop: boolean;
    maxHoldTime: number; // minutes
  };
  profitTargets: {
    quick: { price: number; probability: number; timeframe: number };
    extended: { price: number; probability: number; timeframe: number };
  };
  recommendation: string;
}

export interface HighLeverageAnalysis {
  signal: HighLeverageSignal | null;
  marketSuitability: 'EXCELLENT' | 'GOOD' | 'POOR' | 'AVOID';
  volatilityScore: number;
  liquidationRisk: number;
  expectedProfitTime: number; // minutes
  confidence: number;
}

export class HighLeveragePatternML {
  private readonly HIGH_LEVERAGE_RANGE = [20, 25];
  private readonly QUICK_PROFIT_THRESHOLD = 0.5; // 0.5% minimum for quick profit
  private readonly MAX_HOLD_TIME = 30; // 30 minutes max for high leverage
  
  async analyzeForHighLeverage(
    data: CandlestickData[],
    pair: string
  ): Promise<HighLeverageAnalysis> {
    console.log('🎯 Analyzing for high-leverage quick profit trading...');
    
    // Step 1: Pattern Detection
    const patternResult = patternDetection.detectPatterns(data);
    const bestPattern = patternResult.bestPattern;
    
    // Step 2: ML Enhancement
    let mlSignal = null;
    try {
      mlSignal = await mlEnhancedSignalProcessor.processMLEnhancedSignal(data, pair, true);
    } catch (error) {
      console.log('⚠️ ML processing unavailable, using pattern-only analysis');
    }
    
    // Step 3: Market Suitability Assessment
    const marketSuitability = this.assessMarketSuitability(data, patternResult.volatility);
    
    if (!bestPattern || marketSuitability === 'AVOID') {
      return {
        signal: null,
        marketSuitability,
        volatilityScore: patternResult.volatility,
        liquidationRisk: 0,
        expectedProfitTime: 0,
        confidence: 0
      };
    }
    
    // Step 4: Create High-Leverage Signal
    const highLeverageSignal = this.createHighLeverageSignal(
      bestPattern,
      mlSignal,
      data,
      patternResult.volatility
    );
    
    // Step 5: Risk Assessment
    const riskMetrics = riskManagement.calculateEnhancedRisk(
      {
        type: bestPattern.type,
        confidence: bestPattern.confidence,
        patterns: [bestPattern.patternName],
        entry: bestPattern.entry,
        stopLoss: bestPattern.stopLoss,
        takeProfit: bestPattern.takeProfit,
        riskReward: bestPattern.riskReward,
        leverage: highLeverageSignal.optimalLeverage,
        positionSize: bestPattern.positionSize,
        tradingFees: 0.1,
        netProfit: 0,
        netLoss: 0
      },
      data
    );
    
    const liquidationRisk = this.calculateLiquidationRisk(
      bestPattern,
      highLeverageSignal.optimalLeverage,
      data
    );
    
    console.log('📊 High-Leverage Analysis Results:', {
      pattern: bestPattern.patternName,
      patternReliability: bestPattern.reliability,
      mlConfidence: mlSignal ? (mlSignal.mlConfidence * 100).toFixed(1) + '%' : 'N/A',
      hybridConfidence: (highLeverageSignal.hybridConfidence * 100).toFixed(1) + '%',
      optimalLeverage: highLeverageSignal.optimalLeverage + 'x',
      quickProfitPotential: (highLeverageSignal.quickProfitPotential * 100).toFixed(2) + '%',
      liquidationRisk: (liquidationRisk * 100).toFixed(1) + '%',
      entryTiming: highLeverageSignal.entryTiming
    });
    
    return {
      signal: highLeverageSignal,
      marketSuitability,
      volatilityScore: patternResult.volatility,
      liquidationRisk,
      expectedProfitTime: highLeverageSignal.profitTargets.quick.timeframe,
      confidence: highLeverageSignal.hybridConfidence
    };
  }
  
  private createHighLeverageSignal(
    pattern: PatternSignal,
    mlSignal: any,
    data: CandlestickData[],
    volatility: number
  ): HighLeverageSignal {
    // Combine pattern and ML confidence
    const mlConfidence = mlSignal ? mlSignal.mlConfidence : 0;
    const patternConfidence = pattern.confidence;
    
    // Weighted hybrid confidence (60% pattern, 40% ML)
    const hybridConfidence = (patternConfidence * 0.6) + (mlConfidence * 0.4);
    
    // Calculate optimal leverage based on pattern reliability and volatility
    const baseLeverage = Math.floor(Math.random() * (this.HIGH_LEVERAGE_RANGE[1] - this.HIGH_LEVERAGE_RANGE[0] + 1)) + this.HIGH_LEVERAGE_RANGE[0];
    const reliabilityAdjustment = pattern.reliability > 75 ? 2 : pattern.reliability > 70 ? 1 : -1;
    const volatilityAdjustment = volatility > 0.05 ? -2 : volatility > 0.03 ? -1 : 0;
    
    const optimalLeverage = Math.max(15, Math.min(25, baseLeverage + reliabilityAdjustment + volatilityAdjustment));
    
    // Calculate quick profit potential
    const atr = this.calculateATR(data);
    const currentPrice = data[data.length - 1].close;
    const priceDistance = Math.abs(pattern.takeProfit - pattern.entry);
    const quickProfitPotential = (priceDistance / currentPrice) * optimalLeverage;
    
    // Determine entry timing
    const entryTiming = this.determineEntryTiming(pattern, mlSignal, hybridConfidence);
    
    // Calculate profit targets with time estimates
    const profitTargets = {
      quick: {
        price: pattern.type === 'BUY' ? 
          pattern.entry + (atr * 2) : 
          pattern.entry - (atr * 2),
        probability: pattern.reliability,
        timeframe: this.estimateTimeToProfit(pattern, atr, 'QUICK')
      },
      extended: {
        price: pattern.takeProfit,
        probability: pattern.reliability * 0.8, // Lower probability for extended target
        timeframe: this.estimateTimeToProfit(pattern, atr, 'EXTENDED')
      }
    };
    
    // Enhanced exit strategy for high leverage
    const exitStrategy = {
      quickTakeProfit: profitTargets.quick.price,
      stopLoss: this.calculateTightStopLoss(pattern, atr, optimalLeverage),
      trailingStop: optimalLeverage >= 22,
      maxHoldTime: optimalLeverage >= 22 ? 15 : this.MAX_HOLD_TIME
    };
    
    // Risk score calculation
    const riskScore = this.calculateHighLeverageRiskScore(
      pattern,
      optimalLeverage,
      volatility,
      hybridConfidence
    );
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      pattern,
      hybridConfidence,
      optimalLeverage,
      quickProfitPotential,
      riskScore
    );
    
    return {
      patternSignal: pattern,
      mlConfidence,
      hybridConfidence,
      quickProfitPotential,
      riskScore,
      optimalLeverage,
      entryTiming,
      exitStrategy,
      profitTargets,
      recommendation
    };
  }
  
  private assessMarketSuitability(data: CandlestickData[], volatility: number): 'EXCELLENT' | 'GOOD' | 'POOR' | 'AVOID' {
    // Check recent price action
    const recentData = data.slice(-10);
    const priceRange = Math.max(...recentData.map(d => d.high)) - Math.min(...recentData.map(d => d.low));
    const avgPrice = recentData.reduce((sum, d) => sum + d.close, 0) / recentData.length;
    const rangePercentage = (priceRange / avgPrice) * 100;
    
    // Volume analysis
    const volumes = data.slice(-20).map(d => d.volume);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;
    
    // Trend consistency
    const closes = recentData.map(d => d.close);
    const trendConsistency = this.calculateTrendConsistency(closes);
    
    console.log('🔍 Market Suitability Assessment:', {
      volatility: (volatility * 100).toFixed(2) + '%',
      rangePercentage: rangePercentage.toFixed(2) + '%',
      volumeRatio: volumeRatio.toFixed(2),
      trendConsistency: (trendConsistency * 100).toFixed(1) + '%'
    });
    
    // Excellent: High volatility, good volume, consistent trend
    if (volatility > 0.03 && volumeRatio > 1.5 && trendConsistency > 0.7 && rangePercentage > 2) {
      return 'EXCELLENT';
    }
    
    // Good: Moderate conditions
    if (volatility > 0.02 && volumeRatio > 1.2 && trendConsistency > 0.5 && rangePercentage > 1.5) {
      return 'GOOD';
    }
    
    // Poor: Low activity or inconsistent
    if (volatility < 0.01 || volumeRatio < 0.8 || trendConsistency < 0.3) {
      return 'POOR';
    }
    
    // Avoid: Very low volatility or volume
    if (volatility < 0.005 || volumeRatio < 0.5) {
      return 'AVOID';
    }
    
    return 'POOR';
  }
  
  private determineEntryTiming(
    pattern: PatternSignal,
    mlSignal: any,
    hybridConfidence: number
  ): 'IMMEDIATE' | 'WAIT_CONFIRMATION' | 'AVOID' {
    // High confidence patterns with ML confirmation
    if (hybridConfidence > 0.8 && pattern.reliability > 75) {
      return 'IMMEDIATE';
    }
    
    // Moderate confidence - wait for confirmation
    if (hybridConfidence > 0.6 && pattern.reliability > 70) {
      return 'WAIT_CONFIRMATION';
    }
    
    // Low confidence - avoid
    return 'AVOID';
  }
  
  private calculateTightStopLoss(pattern: PatternSignal, atr: number, leverage: number): number {
    // Tighter stop loss for high leverage
    const riskReduction = leverage > 22 ? 0.6 : 0.8;
    const originalDistance = Math.abs(pattern.entry - pattern.stopLoss);
    const tightDistance = originalDistance * riskReduction;
    
    return pattern.type === 'BUY' ? 
      pattern.entry - tightDistance : 
      pattern.entry + tightDistance;
  }
  
  private estimateTimeToProfit(pattern: PatternSignal, atr: number, type: 'QUICK' | 'EXTENDED'): number {
    // Time estimates based on pattern type and market conditions
    const baseTime = type === 'QUICK' ? 5 : 20; // minutes
    
    // Pattern-specific adjustments
    const patternMultiplier = {
      'Bullish Engulfing': 0.8,
      'Bearish Engulfing': 0.8,
      'Morning Star': 1.2,
      'Evening Star': 1.2,
      'Dragonfly Doji': 1.5,
      'Gravestone Doji': 1.5
    }[pattern.patternName] || 1.0;
    
    return Math.round(baseTime * patternMultiplier);
  }
  
  private calculateHighLeverageRiskScore(
    pattern: PatternSignal,
    leverage: number,
    volatility: number,
    confidence: number
  ): number {
    let riskScore = 0;
    
    // Base risk from leverage
    riskScore += (leverage - 15) * 5; // 5 points per leverage above 15x
    
    // Volatility risk
    riskScore += volatility > 0.05 ? 20 : volatility > 0.03 ? 10 : 0;
    
    // Pattern reliability bonus (reduces risk)
    riskScore -= (pattern.reliability - 50) * 0.5;
    
    // Confidence bonus (reduces risk)
    riskScore -= confidence * 30;
    
    return Math.max(0, Math.min(100, riskScore));
  }
  
  private calculateLiquidationRisk(
    pattern: PatternSignal,
    leverage: number,
    data: CandlestickData[]
  ): number {
    const currentPrice = data[data.length - 1].close;
    const atr = this.calculateATR(data);
    
    // Distance to liquidation (approximately 1/leverage of entry price)
    const liquidationDistance = currentPrice / leverage;
    
    // Compare with recent volatility
    const volatilityRisk = atr > liquidationDistance * 0.8 ? 0.8 : atr / liquidationDistance;
    
    return Math.min(0.95, volatilityRisk);
  }
  
  private generateRecommendation(
    pattern: PatternSignal,
    confidence: number,
    leverage: number,
    profitPotential: number,
    riskScore: number
  ): string {
    if (confidence > 0.8 && profitPotential > 0.01 && riskScore < 30) {
      return `🎯 EXCELLENT: High-confidence ${pattern.patternName} with ${leverage}x leverage. Quick profit potential: ${(profitPotential * 100).toFixed(2)}%. Enter immediately with tight stops.`;
    }
    
    if (confidence > 0.6 && profitPotential > 0.005 && riskScore < 50) {
      return `⚡ GOOD: Reliable ${pattern.patternName} detected. Use ${leverage}x leverage with caution. Wait for confirmation before entry.`;
    }
    
    if (riskScore > 70) {
      return `⚠️ HIGH RISK: Pattern detected but market conditions unfavorable for high leverage. Consider lower leverage or avoid.`;
    }
    
    return `📊 MODERATE: Pattern shows potential but requires careful consideration. Monitor closely before entry.`;
  }
  
  private calculateATR(data: CandlestickData[], period = 14): number {
    if (data.length < period + 1) return data[data.length - 1].close * 0.02;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }
  
  private calculateTrendConsistency(closes: number[]): number {
    if (closes.length < 3) return 0;
    
    let consistentMoves = 0;
    let totalMoves = closes.length - 1;
    
    const overallDirection = closes[closes.length - 1] > closes[0] ? 'UP' : 'DOWN';
    
    for (let i = 1; i < closes.length; i++) {
      const moveDirection = closes[i] > closes[i - 1] ? 'UP' : 'DOWN';
      if (moveDirection === overallDirection) {
        consistentMoves++;
      }
    }
    
    return consistentMoves / totalMoves;
  }
}

export const highLeveragePatternML = new HighLeveragePatternML();
