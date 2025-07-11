import { MarketData } from '../types/marketData';
import { MarketCondition, ConditionDetectionConfig } from '../types/conditions';
import { TechnicalAnalysis } from '../technicalAnalysis';

export class ConditionAnalyzer {
  private ta: TechnicalAnalysis;
  private configs: Map<string, ConditionDetectionConfig> = new Map();

  constructor() {
    this.ta = new TechnicalAnalysis();
  }

  setConfig(symbol: string, config: ConditionDetectionConfig) {
    this.configs.set(symbol, config);
  }

  // Improved volume expectations based on realistic market data
  private getVolumeExpectations(symbol: string) {
    const expectations = {
      'BTC/USDT': { min: 500_000_000, high: 2_000_000_000, veryHigh: 5_000_000_000 },
      'ETH/USDT': { min: 300_000_000, high: 1_000_000_000, veryHigh: 2_500_000_000 },
      'ADA/USDT': { min: 50_000_000, high: 150_000_000, veryHigh: 400_000_000 },
      'SOL/USDT': { min: 30_000_000, high: 100_000_000, veryHigh: 300_000_000 },
      'XRP/USDT': { min: 100_000_000, high: 300_000_000, veryHigh: 800_000_000 },
      'DOGE/USDT': { min: 200_000_000, high: 600_000_000, veryHigh: 1_500_000_000 },
      'DOT/USDT': { min: 20_000_000, high: 60_000_000, veryHigh: 150_000_000 },
      'LINK/USDT': { min: 15_000_000, high: 50_000_000, veryHigh: 120_000_000 },
      'AVAX/USDT': { min: 10_000_000, high: 40_000_000, veryHigh: 100_000_000 }
    };

    return expectations[symbol as keyof typeof expectations] || 
           { min: 5_000_000, high: 25_000_000, veryHigh: 75_000_000 };
  }

  private validateAndEnhanceVolumeData(data: MarketData): MarketData {
    const expectations = this.getVolumeExpectations(data.symbol);
    const isRealistic = data.volume24h >= expectations.min;
    const isHigh = data.volume24h >= expectations.high;
    const isVeryHigh = data.volume24h >= expectations.veryHigh;

    return {
      ...data,
      additionalData: {
        volumeQuality: isVeryHigh ? 'VERY_HIGH' : isHigh ? 'HIGH' : isRealistic ? 'NORMAL' : 'LOW',
        isVolumeRealistic: isRealistic
      }
    };
  }

  private assessVolumeQuality(volume: number, expectations: any): {
    level: 'VERY_HIGH' | 'HIGH' | 'NORMAL' | 'LOW';
    isSignificant: boolean;
    bonus: number;
  } {
    if (volume >= expectations.veryHigh) {
      return { level: 'VERY_HIGH', isSignificant: true, bonus: 25 };
    } else if (volume >= expectations.high) {
      return { level: 'HIGH', isSignificant: true, bonus: 15 };
    } else if (volume >= expectations.min) {
      return { level: 'NORMAL', isSignificant: true, bonus: 8 };
    } else {
      return { level: 'LOW', isSignificant: false, bonus: 0 };
    }
  }

  analyzeAdvancedConditions(marketData: MarketData[], historicalData?: any[]): MarketCondition[] {
    const conditions: MarketCondition[] = [];
    
    marketData.forEach(data => {
      const config = this.configs.get(data.symbol) || this.getDefaultConfig(data.symbol);
      const symbolConditions = this.analyzeSymbolConditions(data, config, historicalData);
      conditions.push(...symbolConditions);
    });

    return this.prioritizeConditions(conditions);
  }

  private analyzeSymbolConditions(data: MarketData, config: ConditionDetectionConfig, historicalData?: any[]): MarketCondition[] {
    const conditions: MarketCondition[] = [];
    const thresholds = this.getThresholds(config, data);

    // Enhanced High/Low Detection with better volume analysis
    const highLowConditions = this.detectHighLowConditions(data, thresholds);
    conditions.push(...highLowConditions);

    // Improved Volume Analysis
    const volumeConditions = this.detectVolumeConditions(data, thresholds);
    conditions.push(...volumeConditions);

    // Support/Resistance Testing
    if (historicalData) {
      const supportResistanceConditions = this.detectSupportResistanceConditions(data, historicalData, thresholds);
      conditions.push(...supportResistanceConditions);
    }

    // Enhanced Breakout/Breakdown Detection
    const breakoutConditions = this.detectBreakoutConditions(data, thresholds);
    conditions.push(...breakoutConditions);

    return conditions;
  }

  private detectHighLowConditions(data: MarketData, thresholds: any): MarketCondition[] {
    const conditions: MarketCondition[] = [];
    
    if (data.high24h === 0 || data.low24h === 0) return conditions;
    
    const currentPrice = data.price;
    const high24h = data.high24h;
    const low24h = data.low24h;
    
    const distanceFromHigh = ((high24h - currentPrice) / high24h) * 100;
    const distanceFromLow = ((currentPrice - low24h) / low24h) * 100;

    // Enhanced volume validation
    const volumeExpectations = this.getVolumeExpectations(data.symbol);
    const volumeQuality = this.assessVolumeQuality(data.volume24h, volumeExpectations);
    
    // Dynamic thresholds based on volatility and volume
    const volatility = Math.abs(data.changePercent24h);
    const dynamicHighThreshold = Math.max(thresholds.nearHigh * (1 + volatility / 200), 0.8);
    const dynamicLowThreshold = Math.max(thresholds.nearLow * (1 + volatility / 200), 0.8);

    // High conditions with enhanced logic
    if (distanceFromHigh <= dynamicHighThreshold) {
      const isAtHigh = distanceFromHigh <= 0.3;
      
      conditions.push({
        symbol: data.symbol,
        condition: isAtHigh ? 'AT_HIGH' : 'NEAR_HIGH',
        severity: this.calculateSeverity(distanceFromHigh, volatility, volumeQuality.isSignificant),
        currentPrice,
        targetPrice: high24h,
        distancePercent: distanceFromHigh,
        recommendation: this.getHighRecommendation(distanceFromHigh, volatility, volumeQuality),
        confidence: this.calculateConfidence(distanceFromHigh, volatility, volumeQuality.isSignificant),
        timeframe: '24h',
        additionalData: {
          volume: data.volume24h,
          volumeQuality: volumeQuality.level,
          trend: data.changePercent24h > 0 ? 'BULLISH' : 'BEARISH',
          resistanceLevel: high24h
        }
      });
    }

    // Low conditions with enhanced logic
    if (distanceFromLow <= dynamicLowThreshold) {
      const isAtLow = distanceFromLow <= 0.3;
      
      conditions.push({
        symbol: data.symbol,
        condition: isAtLow ? 'AT_LOW' : 'NEAR_LOW',
        severity: this.calculateSeverity(distanceFromLow, volatility, volumeQuality.isSignificant),
        currentPrice,
        targetPrice: low24h,
        distancePercent: distanceFromLow,
        recommendation: this.getLowRecommendation(distanceFromLow, volatility, volumeQuality),
        confidence: this.calculateConfidence(distanceFromLow, volatility, volumeQuality.isSignificant),
        timeframe: '24h',
        additionalData: {
          volume: data.volume24h,
          volumeQuality: volumeQuality.level,
          trend: data.changePercent24h > 0 ? 'BULLISH' : 'BEARISH',
          supportLevel: low24h
        }
      });
    }

    return conditions;
  }

  private detectVolumeConditions(data: MarketData, thresholds: any): MarketCondition[] {
    const conditions: MarketCondition[] = [];
    const volatility = Math.abs(data.changePercent24h);
    const volumeExpectations = this.getVolumeExpectations(data.symbol);
    const volumeQuality = this.assessVolumeQuality(data.volume24h, volumeExpectations);
    
    // Enhanced volatility detection with volume confirmation
    if (volatility > 8) { // Lowered from 15 to 8
      const severity = volatility > 20 ? 'CRITICAL' : volatility > 12 ? 'HIGH' : 'MEDIUM';
      
      conditions.push({
        symbol: data.symbol,
        condition: 'VOLATILE',
        severity,
        currentPrice: data.price,
        targetPrice: data.price,
        distancePercent: volatility,
        recommendation: `Enhanced volatility detected (${volatility.toFixed(1)}%) with ${volumeQuality.level.toLowerCase()} volume. ${this.getVolatilityRecommendation(volatility, volumeQuality)}`,
        confidence: Math.min((volatility / 20) * 80 + volumeQuality.bonus, 95),
        timeframe: '24h',
        additionalData: {
          volume: data.volume24h,
          volumeQuality: volumeQuality.level,
          trend: data.changePercent24h > 0 ? 'BULLISH' : 'BEARISH'
        }
      });
    }

    return conditions;
  }

  private getVolatilityRecommendation(volatility: number, volumeQuality: any): string {
    if (volumeQuality.level === 'VERY_HIGH') {
      return "Strong volume confirms the move. Consider position sizing and momentum trading.";
    } else if (volumeQuality.level === 'HIGH') {
      return "Good volume support. Monitor for continuation or reversal signals.";
    } else if (volumeQuality.level === 'NORMAL') {
      return "Moderate volume. Use caution and tight risk management.";
    } else {
      return "Low volume - volatility may be misleading. Wait for volume confirmation.";
    }
  }

  private detectSupportResistanceConditions(data: MarketData, historicalData: any[], thresholds: any): MarketCondition[] {
    return [];
  }

  private detectBreakoutConditions(data: MarketData, thresholds: any): MarketCondition[] {
    const conditions: MarketCondition[] = [];
    const volatility = Math.abs(data.changePercent24h);
    const volumeExpectations = this.getVolumeExpectations(data.symbol);
    const volumeQuality = this.assessVolumeQuality(data.volume24h, volumeExpectations);
    
    // Enhanced breakout detection with volume confirmation
    if (volatility > 3 && data.changePercent24h > 0) { // Lowered from 5 to 3
      const isSignificantMove = volatility > 6; // Lowered from 8
      
      if (isSignificantMove && volumeQuality.isSignificant) {
        conditions.push({
          symbol: data.symbol,
          condition: 'BREAKOUT',
          severity: volatility > 12 ? 'HIGH' : 'MEDIUM',
          currentPrice: data.price,
          targetPrice: data.high24h,
          distancePercent: volatility,
          recommendation: `Enhanced breakout detected with ${volumeQuality.level.toLowerCase()} volume. Monitor for continuation above ${data.high24h.toFixed(6)}.`,
          confidence: Math.min((volatility / 12) * 70 + volumeQuality.bonus, 90),
          timeframe: '24h',
          additionalData: {
            volume: data.volume24h,
            volumeQuality: volumeQuality.level,
            trend: 'BULLISH'
          }
        });
      }
    } else if (volatility > 3 && data.changePercent24h < 0) {
      const isSignificantMove = volatility > 6;
      
      if (isSignificantMove && volumeQuality.isSignificant) {
        conditions.push({
          symbol: data.symbol,
          condition: 'BREAKDOWN',
          severity: volatility > 12 ? 'HIGH' : 'MEDIUM',
          currentPrice: data.price,
          targetPrice: data.low24h,
          distancePercent: volatility,
          recommendation: `Enhanced breakdown detected with ${volumeQuality.level.toLowerCase()} volume. Watch for further decline below ${data.low24h.toFixed(6)}.`,
          confidence: Math.min((volatility / 12) * 70 + volumeQuality.bonus, 90),
          timeframe: '24h',
          additionalData: {
            volume: data.volume24h,
            volumeQuality: volumeQuality.level,
            trend: 'BEARISH'
          }
        });
      }
    }

    return conditions;
  }

  private getThresholds(config: ConditionDetectionConfig, data: MarketData) {
    const baseThresholds = {
      nearHigh: 2.0,
      nearLow: 2.0,
      volatility: 15,
      volumeSpike: 2.0
    };

    const multiplier = config.sensitivity === 'HIGH' ? 0.75 : 
                     config.sensitivity === 'LOW' ? 1.25 : 1.0;

    return {
      nearHigh: (config.customThresholds?.nearHighPercent || baseThresholds.nearHigh) * multiplier,
      nearLow: (config.customThresholds?.nearLowPercent || baseThresholds.nearLow) * multiplier,
      volatility: (config.customThresholds?.volatilityThreshold || baseThresholds.volatility) * multiplier,
      volumeSpike: (config.customThresholds?.volumeSpike || baseThresholds.volumeSpike) * multiplier
    };
  }

  private calculateSeverity(distance: number, volatility: number, hasVolumeConfirmation: boolean): MarketCondition['severity'] {
    let score = 0;
    
    if (distance <= 0.5) score += 3;
    else if (distance <= 1) score += 2;
    else if (distance <= 2) score += 1;
    
    if (volatility > 15) score += 2;
    else if (volatility > 8) score += 1;
    
    if (hasVolumeConfirmation) score += 1;
    
    if (score >= 5) return 'CRITICAL';
    if (score >= 3) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private calculateConfidence(distance: number, volatility: number, hasVolumeConfirmation: boolean): number {
    let confidence = 50;
    
    if (distance <= 0.5) confidence += 25;
    else if (distance <= 1) confidence += 15;
    else if (distance <= 2) confidence += 8;
    
    if (volatility > 8) confidence += 12;
    if (volatility > 15) confidence += 8;
    
    if (hasVolumeConfirmation) confidence += 15;
    
    return Math.min(confidence, 95);
  }

  private getHighRecommendation(distance: number, volatility: number, volumeQuality: any): string {
    const volumeContext = volumeQuality.level === 'VERY_HIGH' ? ' with very high volume' : 
                         volumeQuality.level === 'HIGH' ? ' with high volume' : 
                         volumeQuality.level === 'NORMAL' ? ' with normal volume' : ' with low volume';
    
    if (distance <= 0.5) {
      return `🚨 AT 24H HIGH${volumeContext}! ${volumeQuality.isSignificant ? 'Strong' : 'Weak'} volume confirmation. Consider profit-taking or breakout setup.`;
    } else if (distance <= 1) {
      return `⚠️ Very close to 24h high${volumeContext}. ${volumeQuality.isSignificant ? 'Volume supports the move' : 'Waiting for volume confirmation'}.`;
    } else {
      return `📈 Approaching 24h high${volumeContext}. Monitor momentum and ${volumeQuality.isSignificant ? 'continue watching' : 'wait for volume'}.`;
    }
  }

  private getLowRecommendation(distance: number, volatility: number, volumeQuality: any): string {
    const volumeContext = volumeQuality.level === 'VERY_HIGH' ? ' with very high volume' : 
                         volumeQuality.level === 'HIGH' ? ' with high volume' : 
                         volumeQuality.level === 'NORMAL' ? ' with normal volume' : ' with low volume';
    
    if (distance <= 0.5) {
      return `🚨 AT 24H LOW${volumeContext}! ${volumeQuality.isSignificant ? 'Volume may signal capitulation' : 'Wait for volume confirmation'}. Potential bounce opportunity.`;
    } else if (distance <= 1) {
      return `⚠️ Very close to 24h low${volumeContext}. ${volumeQuality.isSignificant ? 'Volume suggests selling pressure' : 'Monitor for volume increase'}.`;
    } else {
      return `📉 Approaching 24h low${volumeContext}. Watch for support test and ${volumeQuality.isSignificant ? 'potential reversal' : 'volume confirmation'}.`;
    }
  }

  private prioritizeConditions(conditions: MarketCondition[]): MarketCondition[] {
    return conditions.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.confidence - a.confidence;
    });
  }

  private getDefaultConfig(symbol: string): ConditionDetectionConfig {
    return {
      symbol,
      sensitivity: 'MEDIUM'
    };
  }
}

export const conditionAnalyzer = new ConditionAnalyzer();
