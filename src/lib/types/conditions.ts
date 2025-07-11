
export interface MarketCondition {
  symbol: string;
  condition: 'AT_HIGH' | 'NEAR_HIGH' | 'AT_LOW' | 'NEAR_LOW' | 'VOLATILE' | 'STABLE' | 'BREAKOUT' | 'BREAKDOWN' | 'SUPPORT_TEST' | 'RESISTANCE_TEST';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  currentPrice: number;
  targetPrice: number;
  distancePercent: number;
  recommendation: string;
  confidence: number;
  timeframe: string;
  additionalData?: {
    volume?: number;
    volumeQuality?: 'VERY_HIGH' | 'HIGH' | 'NORMAL' | 'LOW';
    rsi?: number;
    trend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    supportLevel?: number;
    resistanceLevel?: number;
    breakoutVolume?: boolean;
    volumeConfirmation?: boolean;
  };
}

export interface ConditionDetectionConfig {
  symbol: string;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  customThresholds?: {
    nearHighPercent?: number;
    nearLowPercent?: number;
    volatilityThreshold?: number;
    volumeSpike?: number;
  };
}
