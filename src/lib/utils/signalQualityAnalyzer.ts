
import { TradingSignal, CandlestickData } from '../technicalAnalysis';
import { VolumeValidation } from './volumeValidator';

export interface QualityMetrics {
  qualityScore: number;
  marketCondition: string;
  volatility: number;
  trend: string;
  momentum: number;
  priceChange: number;
}

export class SignalQualityAnalyzer {
  static analyze(
    signal: TradingSignal,
    indicators: any,
    candlestickData: CandlestickData[],
    volumeValidation: VolumeValidation
  ): QualityMetrics {
    let qualityScore = 20; // More balanced base score
    let marketCondition = 'NEUTRAL';
    
    const latest = candlestickData[candlestickData.length - 1];
    const rsi = indicators.rsi[indicators.rsi.length - 1];
    const macd = indicators.macd[indicators.macd.length - 1];
    
    // Balanced scoring for all signal types
    if (signal.type === 'BUY') {
      qualityScore += 15; // Moderate bonus for BUY signals
    } else if (signal.type === 'SELL') {
      qualityScore += 15; // Equal bonus for SELL signals
    } else {
      qualityScore += 5; // Small bonus for neutral signals
    }
    
    // Balanced pattern analysis
    if (signal.patterns.length > 0) {
      const patternBonus = Math.min(signal.patterns.length * 12, 30); // Cap pattern bonus
      qualityScore += patternBonus;
      console.log(`📈 Pattern bonus: +${patternBonus} for patterns:`, signal.patterns);
    }
    
    // Balanced RSI confirmation
    if (rsi) {
      // BUY signals: favor oversold conditions
      if (signal.type === 'BUY' && rsi < 70) qualityScore += 15;
      if (signal.type === 'BUY' && rsi < 30) qualityScore += 10; // Extra for oversold
      
      // SELL signals: favor overbought conditions  
      if (signal.type === 'SELL' && rsi > 30) qualityScore += 15;
      if (signal.type === 'SELL' && rsi > 70) qualityScore += 10; // Extra for overbought
      
      // Neutral range gets smaller bonus
      if (rsi > 20 && rsi < 80) qualityScore += 8;
    }
    
    // Balanced MACD confirmation
    if (macd) {
      if (signal.type === 'BUY' && macd.macd > macd.signal) qualityScore += 15;
      if (signal.type === 'SELL' && macd.macd < macd.signal) qualityScore += 15;
      
      const macdDivergence = Math.abs(macd.macd - macd.signal);
      if (macdDivergence > 0.0001) qualityScore += 10;
      
      // MACD histogram bonus
      if (macd.histogram) {
        const histogramValue = Math.abs(macd.histogram[macd.histogram.length - 1] || 0);
        if (histogramValue > 0.0001) qualityScore += 8;
        
        // Direction-specific histogram bonus
        if (signal.type === 'BUY' && macd.histogram[macd.histogram.length - 1] > 0) {
          qualityScore += 12;
        }
        if (signal.type === 'SELL' && macd.histogram[macd.histogram.length - 1] < 0) {
          qualityScore += 12;
        }
      }
    }
    
    // Balanced volume confirmation
    if (volumeValidation) {
      qualityScore += Math.min(volumeValidation.qualityBonus || 0, 15);
      qualityScore += Math.min(volumeValidation.volumeScore || 0, 10);
      console.log(`📊 Volume bonus: +${Math.min((volumeValidation.qualityBonus || 0) + (volumeValidation.volumeScore || 0), 25)}`);
    }
    
    // Balanced risk-reward ratio scoring
    if (signal.riskReward > 0.5) qualityScore += 10;
    if (signal.riskReward > 1.0) qualityScore += 10; 
    if (signal.riskReward > 1.5) qualityScore += 8;
    if (signal.riskReward > 2.0) qualityScore += 5;
    
    // Market condition analysis with balanced thresholds
    const recentChanges = candlestickData.slice(-5).map((candle, i, arr) => 
      i > 0 ? (candle.close - arr[i-1].close) / arr[i-1].close : 0
    ).slice(1);
    
    const avgChange = recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length;
    const volatility = Math.sqrt(recentChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / recentChanges.length);
    
    // Balanced market condition detection
    if (Math.abs(avgChange) > 0.001) marketCondition = 'TRENDING';
    if (volatility > 0.005) marketCondition = 'VOLATILE';
    if (volatility < 0.002) marketCondition = 'STABLE';
    
    // Balanced market condition bonuses
    if (marketCondition === 'TRENDING') {
      qualityScore += 15;
      // Direction-specific trending bonus
      if (signal.type === 'BUY' && avgChange > 0) qualityScore += 15;
      if (signal.type === 'SELL' && avgChange < 0) qualityScore += 15;
      // Counter-trend signals get smaller bonus
      if (signal.type === 'BUY' && avgChange < 0) qualityScore += 8;
      if (signal.type === 'SELL' && avgChange > 0) qualityScore += 8;
    }
    
    if (marketCondition === 'VOLATILE') {
      qualityScore += 12; // Good for volatility trading
    }
    
    if (marketCondition === 'STABLE') {
      qualityScore += 8; // Moderate bonus for stable conditions
    }
    
    // Balanced price momentum scoring
    const priceChange = (latest.close - candlestickData[candlestickData.length - 2].close) / candlestickData[candlestickData.length - 2].close;
    if (Math.abs(priceChange) > 0.0005) {
      qualityScore += 12;
      
      // Direction-specific momentum bonus
      if (signal.type === 'BUY' && priceChange > 0) qualityScore += 10;
      if (signal.type === 'SELL' && priceChange < 0) qualityScore += 10;
    }
    
    // Balanced confidence-based bonus
    if (signal.confidence > 0.1) qualityScore += 8;
    if (signal.confidence > 0.2) qualityScore += 10;
    if (signal.confidence > 0.3) qualityScore += 12;
    if (signal.confidence > 0.5) qualityScore += 15;
    
    // Remove excessive signal type bias
    const finalScore = Math.min(qualityScore, 85); // Reasonable maximum
    
    console.log(`🎯 Balanced Quality Analysis for ${signal.type} signal:`, {
      baseScore: 20,
      signalType: signal.type,
      patternBonus: signal.patterns.length * 12,
      rsiBonus: rsi ? 'Applied' : 'N/A',
      macdBonus: macd ? 'Applied' : 'N/A',
      volumeBonus: volumeValidation ? 'Applied' : 'N/A',
      marketCondition,
      confidenceBonus: signal.confidence > 0.1 ? 'Applied' : 'N/A',
      finalScore: finalScore
    });
    
    return {
      qualityScore: finalScore,
      marketCondition,
      volatility: volatility * 100,
      trend: avgChange > 0.001 ? 'BULLISH' : avgChange < -0.001 ? 'BEARISH' : 'NEUTRAL',
      momentum: Math.abs(priceChange) * 100,
      priceChange: priceChange * 100
    };
  }
}
