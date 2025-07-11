
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
    let qualityScore = 35; // Increased base score from 25 to 35 for more signals
    let marketCondition = 'NEUTRAL';
    
    const latest = candlestickData[candlestickData.length - 1];
    const rsi = indicators.rsi[indicators.rsi.length - 1];
    const macd = indicators.macd[indicators.macd.length - 1];
    
    // Much more generous base scoring - especially for BUY signals in bullish markets
    if (signal.type === 'BUY') {
      qualityScore += 25; // Extra bonus for BUY signals in current market
    } else if (signal.type === 'SELL') {
      qualityScore += 12; // Less bonus for SELL signals
    } else {
      qualityScore += 8; // Still give bonus for neutral signals
    }
    
    // Ultra-generous pattern analysis - capture any pattern indication
    if (signal.patterns.length > 0) {
      const patternBonus = signal.patterns.length * 25; // Increased from 20 to 25
      qualityScore += patternBonus;
      
      // Extra bonus for bullish patterns
      const bullishPatterns = ['Bullish Engulfing', 'Morning Star', 'Dragonfly Doji', 'Hammer', 'Three White Soldiers', 'Piercing Pattern', 'Bullish Momentum', 'Uptrend Continuation', 'Resistance Breakout'];
      const bullishCount = signal.patterns.filter(p => bullishPatterns.some(bp => p.includes(bp))).length;
      if (bullishCount > 0) {
        qualityScore += bullishCount * 15; // Extra bullish bonus
      }
      
      console.log(`📈 BULLISH-FOCUSED pattern bonus: +${patternBonus + (bullishCount * 15)} for patterns:`, signal.patterns);
    }
    
    // Much more lenient RSI confirmation - catch more opportunities
    if (rsi) {
      if (signal.type === 'BUY' && rsi < 85) qualityScore += 20; // Very relaxed from 75 to 85
      if (signal.type === 'SELL' && rsi > 15) qualityScore += 15; // Relaxed from 25 to 15
      if (rsi > 5 && rsi < 95) qualityScore += 15; // Almost always give bonus
      
      // Special bullish market RSI handling
      if (signal.type === 'BUY' && rsi < 60) qualityScore += 20; // Catch RSI pullbacks in bull market
      if (signal.type === 'BUY' && rsi < 40) qualityScore += 25; // Strong bonus for oversold in bull market
      
      // RSI momentum bonus
      if (indicators.rsi.length > 1) {
        const rsiPrev = indicators.rsi[indicators.rsi.length - 2];
        const rsiMomentum = Math.abs(rsi - rsiPrev);
        if (rsiMomentum > 0.5) qualityScore += 12; // Very low threshold for momentum
      }
    }
    
    // Extremely generous MACD confirmation
    if (macd) {
      if (signal.type === 'BUY' && macd.macd > macd.signal) qualityScore += 25; // Strong bonus
      if (signal.type === 'SELL' && macd.macd < macd.signal) qualityScore += 18;
      
      const macdDivergence = Math.abs(macd.macd - macd.signal);
      if (macdDivergence > 0.0001) qualityScore += 15; // Ultra-low threshold
      
      // MACD histogram bonus with very low threshold
      if (macd.histogram) {
        const histogramValue = Math.abs(macd.histogram[macd.histogram.length - 1] || 0);
        if (histogramValue > 0.0001) qualityScore += 12; // Very low threshold
        
        // Special bullish MACD handling
        if (signal.type === 'BUY' && macd.histogram[macd.histogram.length - 1] > 0) {
          qualityScore += 20; // Strong bullish histogram bonus
        }
      }
    }
    
    // Ultra-generous volume confirmation
    if (volumeValidation) {
      qualityScore += Math.min(volumeValidation.qualityBonus || 0, 20);
      qualityScore += Math.min(volumeValidation.volumeScore || 0, 15);
      
      // Even give bonus for low volume if it's a BUY signal
      if (signal.type === 'BUY' && !volumeValidation.isHigh) {
        qualityScore += 10; // Catch low-volume breakouts
      }
      
      console.log(`📊 Ultra-generous volume bonus: +${Math.min((volumeValidation.qualityBonus || 0) + (volumeValidation.volumeScore || 0), 35)}`);
    }
    
    // Ultra-generous risk-reward ratio scoring
    if (signal.riskReward > 0.3) qualityScore += 18; // Very low threshold
    if (signal.riskReward > 0.6) qualityScore += 15; 
    if (signal.riskReward > 1.0) qualityScore += 12; 
    if (signal.riskReward > 1.5) qualityScore += 10;
    if (signal.riskReward > 2.0) qualityScore += 8;
    
    // Market condition analysis with ultra-low thresholds
    const recentChanges = candlestickData.slice(-5).map((candle, i, arr) => 
      i > 0 ? (candle.close - arr[i-1].close) / arr[i-1].close : 0
    ).slice(1);
    
    const avgChange = recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length;
    const volatility = Math.sqrt(recentChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / recentChanges.length);
    
    // Ultra-lenient market condition detection
    if (Math.abs(avgChange) > 0.0005) marketCondition = 'TRENDING'; // Very low threshold
    if (volatility > 0.003) marketCondition = 'VOLATILE'; // Very low threshold
    if (volatility < 0.008) marketCondition = 'STABLE'; // Higher threshold for stable
    
    // Massive market condition bonuses especially for bullish trends
    if (marketCondition === 'TRENDING') {
      qualityScore += 25; // Increased bonus
      if (signal.type === 'BUY' && avgChange > 0) {
        qualityScore += 30; // HUGE bonus for BUY in uptrend
      }
      if (signal.type === 'SELL' && avgChange < 0) {
        qualityScore += 15; // Less bonus for SELL in downtrend
      }
      // Even give bonus for counter-trend signals (potential reversal catches)
      if (signal.type === 'BUY' && avgChange < 0) {
        qualityScore += 20; // Catch reversal opportunities
      }
    }
    
    if (marketCondition === 'VOLATILE') {
      qualityScore += 20; // Good for volatility trading
    }
    
    if (marketCondition === 'STABLE') {
      qualityScore += 15; // Still give bonus for stable conditions
    }
    
    // Ultra-generous price momentum scoring
    const priceChange = (latest.close - candlestickData[candlestickData.length - 2].close) / candlestickData[candlestickData.length - 2].close;
    if (Math.abs(priceChange) > 0.0001) { // Ultra-low threshold
      qualityScore += 22; // Increased bonus
      
      // Extra bonus for bullish momentum
      if (signal.type === 'BUY' && priceChange > 0) {
        qualityScore += 25; // Catch bullish momentum
      }
    }
    
    // Ultra-generous confidence-based bonus
    if (signal.confidence > 0.05) qualityScore += 15;
    if (signal.confidence > 0.1) qualityScore += 15;
    if (signal.confidence > 0.2) qualityScore += 20;
    if (signal.confidence > 0.3) qualityScore += 25;
    
    // Special bullish market bonus - if any bullish indication, give extra score
    if (signal.type === 'BUY') {
      qualityScore += 20; // Flat bonus for any BUY signal
      
      // Stack bonuses for multiple bullish factors
      let bullishFactors = 0;
      if (rsi && rsi < 70) bullishFactors++;
      if (avgChange > 0) bullishFactors++;
      if (priceChange > 0) bullishFactors++;
      if (signal.patterns.length > 0) bullishFactors++;
      if (macd && macd.macd > macd.signal) bullishFactors++;
      
      qualityScore += bullishFactors * 8; // 8 points per bullish factor
    }
    
    // Final quality score with higher maximum to allow more signals
    const finalScore = Math.min(qualityScore, 120); // Increased max from 100 to 120
    
    console.log(`🎯 ULTRA-BULLISH Quality Analysis for signal:`, {
      baseScore: 35,
      signalType: signal.type,
      patternBonus: signal.patterns.length * 25,
      rsiBonus: rsi ? 'Applied' : 'N/A',
      macdBonus: macd ? 'Applied' : 'N/A',
      volumeBonus: volumeValidation ? 'Applied' : 'N/A',
      marketConditionBonus: marketCondition,
      bullishMarketBonus: signal.type === 'BUY' ? 'MASSIVE' : 'Standard',
      confidenceBonus: signal.confidence > 0.05 ? 'Applied' : 'N/A',
      finalScore: finalScore
    });
    
    return {
      qualityScore: finalScore,
      marketCondition,
      volatility: volatility * 100,
      trend: avgChange > 0.0005 ? 'BULLISH' : avgChange < -0.0005 ? 'BEARISH' : 'NEUTRAL',
      momentum: Math.abs(priceChange) * 100,
      priceChange: priceChange * 100
    };
  }
}
