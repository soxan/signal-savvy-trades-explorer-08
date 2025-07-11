import { MarketData } from '@/lib/types/marketData';
import { CandlestickData } from '@/lib/technicalAnalysis';

export interface MarketTrendAnalysis {
  overallTrend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  trendStrength: number; // 0-100
  majorPairsAlignment: number; // 0-100 (how aligned major pairs are)
  volumeConfirmation: boolean;
  momentum: 'ACCELERATING' | 'STABLE' | 'DECELERATING';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedBias: 'BUY_BIAS' | 'SELL_BIAS' | 'NEUTRAL_BIAS';
  confidence: number;
}

export class MarketTrendAnalyzer {
  private static instance: MarketTrendAnalyzer;
  private lastAnalysis: MarketTrendAnalysis | null = null;
  private analysisTimestamp = 0;

  static getInstance(): MarketTrendAnalyzer {
    if (!MarketTrendAnalyzer.instance) {
      MarketTrendAnalyzer.instance = new MarketTrendAnalyzer();
    }
    return MarketTrendAnalyzer.instance;
  }

  analyzeMarketTrend(marketData: MarketData[]): MarketTrendAnalysis {
    // Cache analysis for 5 minutes
    if (this.lastAnalysis && (Date.now() - this.analysisTimestamp) < 300000) {
      return this.lastAnalysis;
    }

    console.log('🔍 Analyzing overall market trend...');

    const majorPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];
    const majorPairsData = marketData.filter(data => majorPairs.includes(data.symbol));

    if (majorPairsData.length === 0) {
      return this.getDefaultAnalysis();
    }

    // Calculate trend metrics
    const bullishCount = majorPairsData.filter(data => data.change24h > 0).length;
    const bearishCount = majorPairsData.filter(data => data.change24h < 0).length;
    const strongBullishCount = majorPairsData.filter(data => data.changePercent24h > 5).length;
    const strongBearishCount = majorPairsData.filter(data => data.changePercent24h < -5).length;

    // Calculate average change
    const avgChange = majorPairsData.reduce((sum, data) => sum + data.changePercent24h, 0) / majorPairsData.length;
    
    // Calculate volume confirmation - fixed property access
    const highVolumeCount = majorPairsData.filter(data => 
      data.volumeQuality === 'VERY_HIGH' || data.volumeQuality === 'HIGH' ||
      data.additionalData?.volumeQuality === 'VERY_HIGH' || data.additionalData?.volumeQuality === 'HIGH'
    ).length;
    const volumeConfirmation = highVolumeCount / majorPairsData.length > 0.6;

    // Determine overall trend
    let overallTrend: MarketTrendAnalysis['overallTrend'];
    let trendStrength = 0;
    let recommendedBias: MarketTrendAnalysis['recommendedBias'];

    if (strongBullishCount >= 3 || (bullishCount >= 4 && avgChange > 3)) {
      overallTrend = 'STRONG_BULLISH';
      trendStrength = Math.min(85 + (avgChange * 2), 100);
      recommendedBias = 'BUY_BIAS';
    } else if (bullishCount >= 3 || avgChange > 1) {
      overallTrend = 'BULLISH';
      trendStrength = Math.min(65 + (avgChange * 3), 85);
      recommendedBias = 'BUY_BIAS';
    } else if (strongBearishCount >= 3 || (bearishCount >= 4 && avgChange < -3)) {
      overallTrend = 'STRONG_BEARISH';
      trendStrength = Math.min(85 + (Math.abs(avgChange) * 2), 100);
      recommendedBias = 'SELL_BIAS';
    } else if (bearishCount >= 3 || avgChange < -1) {
      overallTrend = 'BEARISH';
      trendStrength = Math.min(65 + (Math.abs(avgChange) * 3), 85);
      recommendedBias = 'SELL_BIAS';
    } else {
      overallTrend = 'NEUTRAL';
      trendStrength = 40 + Math.abs(avgChange) * 5;
      recommendedBias = 'NEUTRAL_BIAS';
    }

    // Calculate momentum
    const recentStrong = strongBullishCount + strongBearishCount;
    let momentum: MarketTrendAnalysis['momentum'];
    if (recentStrong >= 3) {
      momentum = 'ACCELERATING';
    } else if (recentStrong >= 1) {
      momentum = 'STABLE';
    } else {
      momentum = 'DECELERATING';
    }

    // Calculate alignment
    const majorPairsAlignment = ((bullishCount + bearishCount) / majorPairsData.length) * 100;

    // Risk level
    let riskLevel: MarketTrendAnalysis['riskLevel'];
    if (trendStrength > 80 && volumeConfirmation) {
      riskLevel = 'LOW';
    } else if (trendStrength > 60) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    const confidence = Math.min(
      (trendStrength * 0.4) + 
      (majorPairsAlignment * 0.3) + 
      (volumeConfirmation ? 20 : 0) + 
      (momentum === 'ACCELERATING' ? 10 : 0),
      95
    );

    this.lastAnalysis = {
      overallTrend,
      trendStrength,
      majorPairsAlignment,
      volumeConfirmation,
      momentum,
      riskLevel,
      recommendedBias,
      confidence
    };

    this.analysisTimestamp = Date.now();

    console.log('📈 Market Trend Analysis:', {
      trend: overallTrend,
      strength: trendStrength.toFixed(1) + '%',
      bias: recommendedBias,
      confidence: confidence.toFixed(1) + '%',
      momentum,
      riskLevel
    });

    return this.lastAnalysis;
  }

  private getDefaultAnalysis(): MarketTrendAnalysis {
    return {
      overallTrend: 'NEUTRAL',
      trendStrength: 50,
      majorPairsAlignment: 50,
      volumeConfirmation: false,
      momentum: 'STABLE',
      riskLevel: 'MEDIUM',
      recommendedBias: 'NEUTRAL_BIAS',
      confidence: 30
    };
  }

  getAdaptiveSignalConfig(trend: MarketTrendAnalysis) {
    switch (trend.overallTrend) {
      case 'STRONG_BULLISH':
        return {
          buySignalMultiplier: 2.5,
          sellSignalMultiplier: 0.3,
          confidenceBoost: 0.25,
          patternSensitivity: 0.6, // Lower = more sensitive
          riskTolerance: 'HIGH'
        };
      case 'BULLISH':
        return {
          buySignalMultiplier: 1.8,
          sellSignalMultiplier: 0.6,
          confidenceBoost: 0.15,
          patternSensitivity: 0.7,
          riskTolerance: 'MEDIUM'
        };
      case 'STRONG_BEARISH':
        return {
          buySignalMultiplier: 0.3,
          sellSignalMultiplier: 2.5,
          confidenceBoost: 0.25,
          patternSensitivity: 0.6,
          riskTolerance: 'HIGH'
        };
      case 'BEARISH':
        return {
          buySignalMultiplier: 0.6,
          sellSignalMultiplier: 1.8,
          confidenceBoost: 0.15,
          patternSensitivity: 0.7,
          riskTolerance: 'MEDIUM'
        };
      default:
        return {
          buySignalMultiplier: 1.0,
          sellSignalMultiplier: 1.0,
          confidenceBoost: 0.0,
          patternSensitivity: 0.8,
          riskTolerance: 'LOW'
        };
    }
  }
}

export const marketTrendAnalyzer = MarketTrendAnalyzer.getInstance();
