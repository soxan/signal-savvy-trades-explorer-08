
import { CandlestickData } from '../technicalAnalysis';

export interface SupportResistanceLevel {
  price: number;
  strength: number;
  type: 'SUPPORT' | 'RESISTANCE';
  touches: number;
  lastTouch: number;
}

export interface MarketStructure {
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  keyLevels: SupportResistanceLevel[];
  structureBreak: boolean;
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquidityZones: LiquidityZone[];
}

export interface OrderBlock {
  high: number;
  low: number;
  type: 'BULLISH' | 'BEARISH';
  strength: number;
  timestamp: number;
}

export interface FairValueGap {
  upper: number;
  lower: number;
  type: 'BULLISH' | 'BEARISH';
  filled: boolean;
  timestamp: number;
}

export interface LiquidityZone {
  price: number;
  type: 'BUY_SIDE' | 'SELL_SIDE';
  strength: number;
  volume: number;
}

export class MarketStructureAnalysis {
  
  analyzeMarketStructure(data: CandlestickData[]): MarketStructure {
    if (data.length < 50) {
      return this.getDefaultStructure();
    }
    
    console.log('🏗️ Analyzing market structure...');
    
    const keyLevels = this.findSupportResistanceLevels(data);
    const trend = this.identifyTrend(data);
    const structureBreak = this.detectStructureBreak(data, keyLevels);
    const orderBlocks = this.identifyOrderBlocks(data);
    const fairValueGaps = this.identifyFairValueGaps(data);
    const liquidityZones = this.identifyLiquidityZones(data);
    
    return {
      trend,
      keyLevels,
      structureBreak,
      orderBlocks,
      fairValueGaps,
      liquidityZones
    };
  }
  
  private findSupportResistanceLevels(data: CandlestickData[]): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const window = 20;
    const tolerance = 0.002; // 0.2% tolerance
    
    // Find pivot highs and lows
    for (let i = window; i < data.length - window; i++) {
      const current = data[i];
      const isHigh = this.isPivotHigh(data, i, window);
      const isLow = this.isPivotLow(data, i, window);
      
      if (isHigh) {
        this.addOrUpdateLevel(levels, current.high, 'RESISTANCE', i, tolerance);
      }
      
      if (isLow) {
        this.addOrUpdateLevel(levels, current.low, 'SUPPORT', i, tolerance);
      }
    }
    
    // Sort by strength and return top levels
    return levels
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10);
  }
  
  private isPivotHigh(data: CandlestickData[], index: number, window: number): boolean {
    const current = data[index].high;
    
    for (let i = index - window; i <= index + window; i++) {
      if (i !== index && data[i].high >= current) {
        return false;
      }
    }
    return true;
  }
  
  private isPivotLow(data: CandlestickData[], index: number, window: number): boolean {
    const current = data[index].low;
    
    for (let i = index - window; i <= index + window; i++) {
      if (i !== index && data[i].low <= current) {
        return false;
      }
    }
    return true;
  }
  
  private addOrUpdateLevel(
    levels: SupportResistanceLevel[],
    price: number,
    type: 'SUPPORT' | 'RESISTANCE',
    timestamp: number,
    tolerance: number
  ) {
    const existing = levels.find(level => 
      Math.abs(level.price - price) / price <= tolerance
    );
    
    if (existing) {
      existing.touches++;
      existing.strength += 1;
      existing.lastTouch = timestamp;
      existing.price = (existing.price + price) / 2; // Average the price
    } else {
      levels.push({
        price,
        strength: 1,
        type,
        touches: 1,
        lastTouch: timestamp
      });
    }
  }
  
  private identifyTrend(data: CandlestickData[]): 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' {
    const recent = data.slice(-50);
    const highs = recent.map(d => d.high);
    const lows = recent.map(d => d.low);
    
    const firstHalf = recent.slice(0, 25);
    const secondHalf = recent.slice(25);
    
    const firstHighs = Math.max(...firstHalf.map(d => d.high));
    const firstLows = Math.min(...firstHalf.map(d => d.low));
    const secondHighs = Math.max(...secondHalf.map(d => d.high));
    const secondLows = Math.min(...secondHalf.map(d => d.low));
    
    const higherHighs = secondHighs > firstHighs;
    const higherLows = secondLows > firstLows;
    const lowerHighs = secondHighs < firstHighs;
    const lowerLows = secondLows < firstLows;
    
    if (higherHighs && higherLows) return 'UPTREND';
    if (lowerHighs && lowerLows) return 'DOWNTREND';
    return 'SIDEWAYS';
  }
  
  private detectStructureBreak(data: CandlestickData[], levels: SupportResistanceLevel[]): boolean {
    if (levels.length === 0 || data.length < 10) return false;
    
    const recent = data.slice(-10);
    const currentPrice = recent[recent.length - 1].close;
    
    // Check if price has broken through any significant level
    return levels.some(level => {
      if (level.type === 'RESISTANCE' && level.strength >= 3) {
        return currentPrice > level.price;
      }
      if (level.type === 'SUPPORT' && level.strength >= 3) {
        return currentPrice < level.price;
      }
      return false;
    });
  }
  
  private identifyOrderBlocks(data: CandlestickData[]): OrderBlock[] {
    const orderBlocks: OrderBlock[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1];
      const current = data[i];
      const next = data[i + 1];
      
      // Bullish Order Block: Strong bullish candle followed by gap up
      if (current.close > current.open && 
          (current.close - current.open) / current.open > 0.02 &&
          next.open > current.close) {
        orderBlocks.push({
          high: current.high,
          low: current.low,
          type: 'BULLISH',
          strength: (current.close - current.open) / current.open * 100,
          timestamp: current.timestamp
        });
      }
      
      // Bearish Order Block: Strong bearish candle followed by gap down
      if (current.close < current.open && 
          (current.open - current.close) / current.open > 0.02 &&
          next.open < current.close) {
        orderBlocks.push({
          high: current.high,
          low: current.low,
          type: 'BEARISH',
          strength: (current.open - current.close) / current.open * 100,
          timestamp: current.timestamp
        });
      }
    }
    
    return orderBlocks.slice(-5); // Keep last 5 order blocks
  }
  
  private identifyFairValueGaps(data: CandlestickData[]): FairValueGap[] {
    const gaps: FairValueGap[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const current = data[i];
      
      // Bullish FVG: Current low > Previous high
      if (current.low > prev.high) {
        gaps.push({
          upper: current.low,
          lower: prev.high,
          type: 'BULLISH',
          filled: false,
          timestamp: current.timestamp
        });
      }
      
      // Bearish FVG: Current high < Previous low
      if (current.high < prev.low) {
        gaps.push({
          upper: prev.low,
          lower: current.high,
          type: 'BEARISH',
          filled: false,
          timestamp: current.timestamp
        });
      }
    }
    
    // Check if gaps are filled
    gaps.forEach(gap => {
      const laterData = data.filter(d => d.timestamp > gap.timestamp);
      gap.filled = laterData.some(d => 
        d.low <= gap.lower && d.high >= gap.upper
      );
    });
    
    return gaps.filter(gap => !gap.filled).slice(-3); // Keep last 3 unfilled gaps
  }
  
  private identifyLiquidityZones(data: CandlestickData[]): LiquidityZone[] {
    const zones: LiquidityZone[] = [];
    const volumeThreshold = this.calculateVolumeThreshold(data);
    
    data.forEach(candle => {
      if (candle.volume > volumeThreshold) {
        // High volume at highs suggests sell-side liquidity
        if (candle.high === Math.max(...data.slice(-20).map(d => d.high))) {
          zones.push({
            price: candle.high,
            type: 'SELL_SIDE',
            strength: candle.volume / volumeThreshold,
            volume: candle.volume
          });
        }
        
        // High volume at lows suggests buy-side liquidity
        if (candle.low === Math.min(...data.slice(-20).map(d => d.low))) {
          zones.push({
            price: candle.low,
            type: 'BUY_SIDE',
            strength: candle.volume / volumeThreshold,
            volume: candle.volume
          });
        }
      }
    });
    
    return zones.slice(-5); // Keep last 5 zones
  }
  
  private calculateVolumeThreshold(data: CandlestickData[]): number {
    const volumes = data.map(d => d.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    return avgVolume * 1.5; // 150% of average volume
  }
  
  private getDefaultStructure(): MarketStructure {
    return {
      trend: 'SIDEWAYS',
      keyLevels: [],
      structureBreak: false,
      orderBlocks: [],
      fairValueGaps: [],
      liquidityZones: []
    };
  }
}

export const marketStructureAnalysis = new MarketStructureAnalysis();
