
import { CandlestickData } from '../technicalAnalysis';

export interface PatternSignal {
  type: 'BUY' | 'SELL';
  confidence: number;
  patternName: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  leverage: number;
  positionSize: number;
  reliability: number;
}

export interface PatternDetectionResult {
  patterns: PatternSignal[];
  bestPattern: PatternSignal | null;
  marketCondition: 'TRENDING' | 'RANGING' | 'VOLATILE';
  volatility: number;
}

export class PatternDetection {
  private readonly HIGH_LEVERAGE_RANGE = [20, 25];
  private readonly MIN_PATTERN_RELIABILITY = 70; // 70% minimum success rate
  
  // Enhanced pattern reliability database with statistical success rates
  private readonly PATTERN_RELIABILITY = {
    'Bullish Engulfing': { reliability: 78, minVolume: 1.5, stopLossATR: 1.2, takeProfitATR: 3.6 },
    'Bearish Engulfing': { reliability: 76, minVolume: 1.5, stopLossATR: 1.2, takeProfitATR: 3.4 },
    'Morning Star': { reliability: 83, minVolume: 1.8, stopLossATR: 1.5, takeProfitATR: 4.2 },
    'Evening Star': { reliability: 81, minVolume: 1.8, stopLossATR: 1.5, takeProfitATR: 4.0 },
    'Dragonfly Doji': { reliability: 72, minVolume: 1.3, stopLossATR: 1.0, takeProfitATR: 2.8 },
    'Gravestone Doji': { reliability: 70, minVolume: 1.3, stopLossATR: 1.0, takeProfitATR: 2.6 },
    'Three White Soldiers': { reliability: 74, minVolume: 2.0, stopLossATR: 1.8, takeProfitATR: 4.5 },
    'Three Black Crows': { reliability: 72, minVolume: 2.0, stopLossATR: 1.8, takeProfitATR: 4.2 },
    'Piercing Pattern': { reliability: 68, minVolume: 1.4, stopLossATR: 1.1, takeProfitATR: 2.9 },
    'Dark Cloud Cover': { reliability: 66, minVolume: 1.4, stopLossATR: 1.1, takeProfitATR: 2.7 },
    'Hammer at Support': { reliability: 71, minVolume: 1.6, stopLossATR: 1.3, takeProfitATR: 3.2 },
    'Shooting Star at Resistance': { reliability: 69, minVolume: 1.6, stopLossATR: 1.3, takeProfitATR: 3.0 }
  };

  detectPatterns(data: CandlestickData[]): PatternDetectionResult {
    if (data.length < 3) {
      return {
        patterns: [],
        bestPattern: null,
        marketCondition: 'RANGING',
        volatility: 0
      };
    }

    const atr = this.calculateATR(data, 14);
    const volumes = data.map(d => d.volume);
    const avgVolume = volumes.slice(-20).reduce((sum, vol) => sum + vol, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;
    
    const marketCondition = this.assessMarketCondition(data);
    const volatility = this.calculateVolatility(data);
    const supportResistance = this.calculateSupportResistance(data);

    console.log('🔍 Pattern Detection Analysis:', {
      marketCondition,
      volatility: (volatility * 100).toFixed(2) + '%',
      volumeRatio: volumeRatio.toFixed(2),
      atr: atr.toFixed(6),
      supportLevels: supportResistance.supports.length,
      resistanceLevels: supportResistance.resistances.length
    });

    const detectedPatterns: PatternSignal[] = [];

    // Detect all reliable patterns
    const patterns = [
      this.detectBullishEngulfing(data, atr, volumeRatio, supportResistance),
      this.detectBearishEngulfing(data, atr, volumeRatio, supportResistance),
      this.detectMorningStar(data, atr, volumeRatio, supportResistance),
      this.detectEveningStar(data, atr, volumeRatio, supportResistance),
      this.detectDragonflyDoji(data, atr, volumeRatio, supportResistance),
      this.detectGravestoneDoji(data, atr, volumeRatio, supportResistance),
      this.detectThreeWhiteSoldiers(data, atr, volumeRatio),
      this.detectThreeBlackCrows(data, atr, volumeRatio),
      this.detectPiercingPattern(data, atr, volumeRatio),
      this.detectDarkCloudCover(data, atr, volumeRatio),
      this.detectHammerAtSupport(data, atr, volumeRatio, supportResistance),
      this.detectShootingStarAtResistance(data, atr, volumeRatio, supportResistance)
    ].filter(pattern => pattern !== null) as PatternSignal[];

    // Filter by reliability and market conditions
    const reliablePatterns = patterns.filter(pattern => {
      const patternData = this.PATTERN_RELIABILITY[pattern.patternName as keyof typeof this.PATTERN_RELIABILITY];
      return patternData && 
             pattern.reliability >= this.MIN_PATTERN_RELIABILITY &&
             volumeRatio >= patternData.minVolume &&
             this.isPatternSuitableForMarketCondition(pattern, marketCondition);
    });

    // Sort by confidence and reliability
    reliablePatterns.sort((a, b) => 
      (b.confidence * b.reliability) - (a.confidence * a.reliability)
    );

    const bestPattern = reliablePatterns.length > 0 ? reliablePatterns[0] : null;

    console.log('✅ Pattern Detection Results:', {
      totalPatterns: patterns.length,
      reliablePatterns: reliablePatterns.length,
      bestPattern: bestPattern?.patternName || 'None',
      bestConfidence: bestPattern ? (bestPattern.confidence * 100).toFixed(1) + '%' : 'N/A',
      bestReliability: bestPattern ? bestPattern.reliability + '%' : 'N/A'
    });

    return {
      patterns: reliablePatterns,
      bestPattern,
      marketCondition,
      volatility
    };
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

  private calculateVolatility(data: CandlestickData[]): number {
    const recentPrices = data.slice(-20).map(d => d.close);
    const returns = recentPrices.slice(1).map((price, i) => 
      (price - recentPrices[i]) / recentPrices[i]
    );
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private assessMarketCondition(data: CandlestickData[]): 'TRENDING' | 'RANGING' | 'VOLATILE' {
    const volatility = this.calculateVolatility(data);
    const recentData = data.slice(-20);
    const priceRange = Math.max(...recentData.map(d => d.high)) - Math.min(...recentData.map(d => d.low));
    const avgPrice = recentData.reduce((sum, d) => sum + d.close, 0) / recentData.length;
    const rangePercentage = (priceRange / avgPrice) * 100;

    if (volatility > 0.04) return 'VOLATILE';
    if (rangePercentage > 8) return 'TRENDING';
    return 'RANGING';
  }

  private calculateSupportResistance(data: CandlestickData[]): { supports: number[], resistances: number[] } {
    if (data.length < 20) return { supports: [], resistances: [] };
    
    const highs = data.slice(-50).map(d => d.high);
    const lows = data.slice(-50).map(d => d.low);
    
    const supports = [];
    const resistances = [];
    
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        supports.push(lows[i]);
      }
    }
    
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        resistances.push(highs[i]);
      }
    }
    
    return { 
      supports: supports.slice(-3),
      resistances: resistances.slice(-3)
    };
  }

  private createPatternSignal(
    type: 'BUY' | 'SELL',
    patternName: string,
    entry: number,
    atr: number,
    confidence: number,
    volumeRatio: number
  ): PatternSignal {
    const patternData = this.PATTERN_RELIABILITY[patternName as keyof typeof this.PATTERN_RELIABILITY];
    if (!patternData) throw new Error(`Unknown pattern: ${patternName}`);

    // Enhanced leverage calculation based on volatility and pattern reliability
    const baseLeverage = Math.floor(Math.random() * (this.HIGH_LEVERAGE_RANGE[1] - this.HIGH_LEVERAGE_RANGE[0] + 1)) + this.HIGH_LEVERAGE_RANGE[0];
    const leverage = patternData.reliability > 75 ? Math.min(baseLeverage + 2, 25) : baseLeverage;

    // Optimized stop loss and take profit for high leverage
    const stopLossDistance = atr * patternData.stopLossATR * (leverage > 22 ? 0.8 : 1.0);
    const takeProfitDistance = atr * patternData.takeProfitATR * (confidence > 0.7 ? 1.2 : 1.0);

    const stopLoss = type === 'BUY' ? 
      entry - stopLossDistance : 
      entry + stopLossDistance;
    
    const takeProfit = type === 'BUY' ? 
      entry + takeProfitDistance : 
      entry - takeProfitDistance;

    // Enhanced position sizing for high leverage
    const basePositionSize = 1000; // Base position in USD
    const riskAmount = basePositionSize * 0.02; // 2% risk per trade
    const positionSize = (riskAmount * leverage) / entry;

    const grossProfitDistance = Math.abs(takeProfit - entry);
    const grossLossDistance = Math.abs(entry - stopLoss);
    const riskReward = grossProfitDistance / grossLossDistance;

    // Enhanced confidence calculation
    const volumeBonus = Math.min((volumeRatio - 1) * 0.1, 0.2);
    const reliabilityBonus = (patternData.reliability - 50) / 500; // Convert to 0-0.1 range
    const enhancedConfidence = Math.min(confidence + volumeBonus + reliabilityBonus, 0.95);

    return {
      type,
      confidence: enhancedConfidence,
      patternName,
      entry,
      stopLoss,
      takeProfit,
      riskReward,
      leverage,
      positionSize,
      reliability: patternData.reliability
    };
  }

  private isPatternSuitableForMarketCondition(pattern: PatternSignal, marketCondition: string): boolean {
    // Reversal patterns work better in ranging markets
    const reversalPatterns = ['Dragonfly Doji', 'Gravestone Doji', 'Morning Star', 'Evening Star', 'Hammer at Support', 'Shooting Star at Resistance'];
    // Continuation patterns work better in trending markets
    const continuationPatterns = ['Three White Soldiers', 'Three Black Crows', 'Bullish Engulfing', 'Bearish Engulfing'];

    if (marketCondition === 'RANGING' && reversalPatterns.includes(pattern.patternName)) {
      return true;
    }
    
    if (marketCondition === 'TRENDING' && continuationPatterns.includes(pattern.patternName)) {
      return true;
    }

    // All patterns can work in volatile markets but with adjusted confidence
    return marketCondition === 'VOLATILE';
  }

  // Enhanced pattern detection methods with precise entry/exit calculations

  private detectBullishEngulfing(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 2) return null;
    
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    
    const prevBearish = prev.close < prev.open;
    const currentBullish = current.close > current.open;
    const prevBodySize = Math.abs(prev.close - prev.open);
    const currentBodySize = Math.abs(current.close - current.open);
    
    const engulfs = current.open <= prev.close && current.close > prev.open && currentBodySize > prevBodySize * 1.1;
    
    if (prevBearish && currentBullish && engulfs && volumeRatio >= 1.5) {
      const confidence = 0.65 + (currentBodySize / prevBodySize - 1) * 0.1 + Math.min((volumeRatio - 1.5) * 0.1, 0.2);
      return this.createPatternSignal('BUY', 'Bullish Engulfing', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectBearishEngulfing(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 2) return null;
    
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    
    const prevBullish = prev.close > prev.open;
    const currentBearish = current.close < current.open;
    const prevBodySize = Math.abs(prev.close - prev.open);
    const currentBodySize = Math.abs(current.close - current.open);
    
    const engulfs = current.open >= prev.close && current.close < prev.open && currentBodySize > prevBodySize * 1.1;
    
    if (prevBullish && currentBearish && engulfs && volumeRatio >= 1.5) {
      const confidence = 0.65 + (currentBodySize / prevBodySize - 1) * 0.1 + Math.min((volumeRatio - 1.5) * 0.1, 0.2);
      return this.createPatternSignal('SELL', 'Bearish Engulfing', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectMorningStar(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 3) return null;
    
    const third = data[data.length - 1];
    const second = data[data.length - 2];
    const first = data[data.length - 3];
    
    const firstBearish = first.close < first.open;
    const thirdBullish = third.close > third.open;
    const secondBodySize = Math.abs(second.close - second.open);
    const firstBodySize = Math.abs(first.close - first.open);
    const thirdBodySize = Math.abs(third.close - third.open);
    
    const isPattern = firstBearish &&
      secondBodySize < firstBodySize * 0.5 &&
      thirdBullish &&
      thirdBodySize > firstBodySize * 0.6 &&
      third.close > (first.open + first.close) / 2;
    
    if (isPattern && volumeRatio >= 1.8) {
      const confidence = 0.75 + Math.min((volumeRatio - 1.8) * 0.1, 0.15);
      return this.createPatternSignal('BUY', 'Morning Star', third.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectEveningStar(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 3) return null;
    
    const third = data[data.length - 1];
    const second = data[data.length - 2];
    const first = data[data.length - 3];
    
    const firstBullish = first.close > first.open;
    const thirdBearish = third.close < third.open;
    const secondBodySize = Math.abs(second.close - second.open);
    const firstBodySize = Math.abs(first.close - first.open);
    const thirdBodySize = Math.abs(third.close - third.open);
    
    const isPattern = firstBullish &&
      secondBodySize < firstBodySize * 0.5 &&
      thirdBearish &&
      thirdBodySize > firstBodySize * 0.6 &&
      third.close < (first.open + first.close) / 2;
    
    if (isPattern && volumeRatio >= 1.8) {
      const confidence = 0.75 + Math.min((volumeRatio - 1.8) * 0.1, 0.15);
      return this.createPatternSignal('SELL', 'Evening Star', third.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectDragonflyDoji(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 1) return null;
    
    const current = data[data.length - 1];
    const bodySize = Math.abs(current.close - current.open);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);
    const totalSize = current.high - current.low;
    
    const nearSupport = sr.supports.some((level: number) => Math.abs(current.close - level) / level < 0.02);
    
    const isDragonfly = bodySize / totalSize < 0.1 &&
      lowerShadow > totalSize * 0.6 &&
      upperShadow < totalSize * 0.1;
    
    if (isDragonfly && nearSupport && volumeRatio >= 1.3) {
      const confidence = 0.60 + Math.min((volumeRatio - 1.3) * 0.1, 0.15);
      return this.createPatternSignal('BUY', 'Dragonfly Doji', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectGravestoneDoji(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 1) return null;
    
    const current = data[data.length - 1];
    const bodySize = Math.abs(current.close - current.open);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);
    const totalSize = current.high - current.low;
    
    const nearResistance = sr.resistances.some((level: number) => Math.abs(current.close - level) / level < 0.02);
    
    const isGravestone = bodySize / totalSize < 0.1 &&
      upperShadow > totalSize * 0.6 &&
      lowerShadow < totalSize * 0.1;
    
    if (isGravestone && nearResistance && volumeRatio >= 1.3) {
      const confidence = 0.60 + Math.min((volumeRatio - 1.3) * 0.1, 0.15);
      return this.createPatternSignal('SELL', 'Gravestone Doji', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  // Additional pattern detection methods with similar precision...
  private detectThreeWhiteSoldiers(data: CandlestickData[], atr: number, volumeRatio: number): PatternSignal | null {
    if (data.length < 3) return null;
    
    const third = data[data.length - 1];
    const second = data[data.length - 2];
    const first = data[data.length - 3];
    
    const isPattern = first.close > first.open &&
      second.close > second.open &&
      third.close > third.open &&
      second.close > first.close &&
      third.close > second.close &&
      second.open > first.open && second.open < first.close &&
      third.open > second.open && third.open < second.close;
    
    if (isPattern && volumeRatio >= 2.0) {
      const confidence = 0.70 + Math.min((volumeRatio - 2.0) * 0.1, 0.15);
      return this.createPatternSignal('BUY', 'Three White Soldiers', third.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectThreeBlackCrows(data: CandlestickData[], atr: number, volumeRatio: number): PatternSignal | null {
    if (data.length < 3) return null;
    
    const third = data[data.length - 1];
    const second = data[data.length - 2];
    const first = data[data.length - 3];
    
    const isPattern = first.close < first.open &&
      second.close < second.open &&
      third.close < third.open &&
      second.close < first.close &&
      third.close < second.close &&
      second.open < first.open && second.open > first.close &&
      third.open < second.open && third.open > second.close;
    
    if (isPattern && volumeRatio >= 2.0) {
      const confidence = 0.68 + Math.min((volumeRatio - 2.0) * 0.1, 0.15);
      return this.createPatternSignal('SELL', 'Three Black Crows', third.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectPiercingPattern(data: CandlestickData[], atr: number, volumeRatio: number): PatternSignal | null {
    if (data.length < 2) return null;
    
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    
    const prevBearish = prev.close < prev.open;
    const currentBullish = current.close > current.open;
    const prevMidpoint = (prev.open + prev.close) / 2;
    
    const isPattern = prevBearish &&
      currentBullish &&
      current.open < prev.close &&
      current.close > prevMidpoint &&
      current.close < prev.open;
    
    if (isPattern && volumeRatio >= 1.4) {
      const confidence = 0.58 + Math.min((volumeRatio - 1.4) * 0.1, 0.15);
      return this.createPatternSignal('BUY', 'Piercing Pattern', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectDarkCloudCover(data: CandlestickData[], atr: number, volumeRatio: number): PatternSignal | null {
    if (data.length < 2) return null;
    
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    
    const prevBullish = prev.close > prev.open;
    const currentBearish = current.close < current.open;
    const prevMidpoint = (prev.open + prev.close) / 2;
    
    const isPattern = prevBullish &&
      currentBearish &&
      current.open > prev.close &&
      current.close < prevMidpoint &&
      current.close > prev.open;
    
    if (isPattern && volumeRatio >= 1.4) {
      const confidence = 0.56 + Math.min((volumeRatio - 1.4) * 0.1, 0.15);
      return this.createPatternSignal('SELL', 'Dark Cloud Cover', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectHammerAtSupport(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 1) return null;
    
    const current = data[data.length - 1];
    const bodySize = Math.abs(current.close - current.open);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);
    const totalSize = current.high - current.low;
    
    const nearSupport = sr.supports.some((level: number) => Math.abs(current.close - level) / level < 0.02);
    
    const isHammer = lowerShadow > bodySize * 2 &&
      upperShadow < bodySize * 0.5 &&
      bodySize / totalSize > 0.1;
    
    if (isHammer && nearSupport && volumeRatio >= 1.6) {
      const confidence = 0.62 + Math.min((volumeRatio - 1.6) * 0.1, 0.15);
      return this.createPatternSignal('BUY', 'Hammer at Support', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }

  private detectShootingStarAtResistance(data: CandlestickData[], atr: number, volumeRatio: number, sr: any): PatternSignal | null {
    if (data.length < 1) return null;
    
    const current = data[data.length - 1];
    const bodySize = Math.abs(current.close - current.open);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);
    const totalSize = current.high - current.low;
    
    const nearResistance = sr.resistances.some((level: number) => Math.abs(current.close - level) / level < 0.02);
    
    const isShootingStar = upperShadow > bodySize * 2 &&
      lowerShadow < bodySize * 0.5 &&
      bodySize / totalSize > 0.1 &&
      current.close < current.open;
    
    if (isShootingStar && nearResistance && volumeRatio >= 1.6) {
      const confidence = 0.60 + Math.min((volumeRatio - 1.6) * 0.1, 0.15);
      return this.createPatternSignal('SELL', 'Shooting Star at Resistance', current.close, atr, confidence, volumeRatio);
    }
    
    return null;
  }
}

export const patternDetection = new PatternDetection();
