
import { CandlestickData } from '../technicalAnalysis';

export interface VolumeProfile {
  priceLevel: number;
  volume: number;
  percentage: number;
}

export interface VolumeAnalysisResult {
  vwap: number;
  volumeProfile: VolumeProfile[];
  pocPrice: number; // Point of Control
  valueAreaHigh: number;
  valueAreaLow: number;
  volumeQuality: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  smartMoneyFlow: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  volumeSpike: boolean;
  volumeConfirmation: boolean;
}

export interface SmartMoneyIndicators {
  accumulationDistribution: number[];
  onBalanceVolume: number[];
  moneyFlowIndex: number[];
  volumeWeightedRSI: number[];
}

export class VolumeAnalysis {
  
  analyzeVolume(data: CandlestickData[]): VolumeAnalysisResult {
    if (data.length < 20) {
      return this.getDefaultVolumeAnalysis();
    }
    
    console.log('📊 Analyzing volume patterns...');
    
    const vwap = this.calculateVWAP(data);
    const volumeProfile = this.calculateVolumeProfile(data);
    const pocPrice = this.findPointOfControl(volumeProfile);
    const { valueAreaHigh, valueAreaLow } = this.calculateValueArea(volumeProfile);
    const volumeQuality = this.assessVolumeQuality(data);
    const smartMoneyFlow = this.analyzeSmartMoneyFlow(data);
    const volumeSpike = this.detectVolumeSpike(data);
    const volumeConfirmation = this.checkVolumeConfirmation(data);
    
    return {
      vwap,
      volumeProfile,
      pocPrice,
      valueAreaHigh,
      valueAreaLow,
      volumeQuality,
      smartMoneyFlow,
      volumeSpike,
      volumeConfirmation
    };
  }
  
  calculateSmartMoneyIndicators(data: CandlestickData[]): SmartMoneyIndicators {
    return {
      accumulationDistribution: this.calculateAccumulationDistribution(data),
      onBalanceVolume: this.calculateOnBalanceVolume(data),
      moneyFlowIndex: this.calculateMoneyFlowIndex(data),
      volumeWeightedRSI: this.calculateVolumeWeightedRSI(data)
    };
  }
  
  private calculateVWAP(data: CandlestickData[]): number {
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    data.forEach(candle => {
      const typical = (candle.high + candle.low + candle.close) / 3;
      totalVolumePrice += typical * candle.volume;
      totalVolume += candle.volume;
    });
    
    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }
  
  private calculateVolumeProfile(data: CandlestickData[]): VolumeProfile[] {
    const priceRange = Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low));
    const tickSize = priceRange / 50; // 50 price levels
    const minPrice = Math.min(...data.map(d => d.low));
    
    const profile: Map<number, number> = new Map();
    
    data.forEach(candle => {
      const levels = Math.ceil((candle.high - candle.low) / tickSize);
      const volumePerLevel = candle.volume / Math.max(levels, 1);
      
      for (let i = 0; i < levels; i++) {
        const priceLevel = Math.round((candle.low + i * tickSize - minPrice) / tickSize) * tickSize + minPrice;
        profile.set(priceLevel, (profile.get(priceLevel) || 0) + volumePerLevel);
      }
    });
    
    const totalVolume = Array.from(profile.values()).reduce((a, b) => a + b, 0);
    
    return Array.from(profile.entries())
      .map(([price, volume]) => ({
        priceLevel: price,
        volume,
        percentage: (volume / totalVolume) * 100
      }))
      .sort((a, b) => b.volume - a.volume);
  }
  
  private findPointOfControl(volumeProfile: VolumeProfile[]): number {
    return volumeProfile.length > 0 ? volumeProfile[0].priceLevel : 0;
  }
  
  private calculateValueArea(volumeProfile: VolumeProfile[]): { valueAreaHigh: number; valueAreaLow: number } {
    if (volumeProfile.length === 0) return { valueAreaHigh: 0, valueAreaLow: 0 };
    
    const sortedByVolume = [...volumeProfile].sort((a, b) => b.volume - a.volume);
    const totalVolume = sortedByVolume.reduce((sum, level) => sum + level.volume, 0);
    const valueAreaVolume = totalVolume * 0.68; // 68% of volume
    
    let accumulatedVolume = 0;
    const valueAreaLevels: number[] = [];
    
    for (const level of sortedByVolume) {
      if (accumulatedVolume < valueAreaVolume) {
        valueAreaLevels.push(level.priceLevel);
        accumulatedVolume += level.volume;
      } else {
        break;
      }
    }
    
    const valueAreaHigh = Math.max(...valueAreaLevels);
    const valueAreaLow = Math.min(...valueAreaLevels);
    
    return { valueAreaHigh, valueAreaLow };
  }
  
  private assessVolumeQuality(data: CandlestickData[]): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' {
    const volumes = data.map(d => d.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    
    const volumeRatio = recentVolume / avgVolume;
    const consistency = this.calculateVolumeConsistency(volumes);
    
    if (volumeRatio > 1.5 && consistency > 0.7) return 'EXCELLENT';
    if (volumeRatio > 1.2 && consistency > 0.6) return 'GOOD';
    if (volumeRatio > 0.8 && consistency > 0.4) return 'AVERAGE';
    return 'POOR';
  }
  
  private calculateVolumeConsistency(volumes: number[]): number {
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    return Math.max(0, 1 - coefficientOfVariation);
  }
  
  private analyzeSmartMoneyFlow(data: CandlestickData[]): 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL' {
    const adLine = this.calculateAccumulationDistribution(data);
    const obv = this.calculateOnBalanceVolume(data);
    
    if (adLine.length < 10 || obv.length < 10) return 'NEUTRAL';
    
    const adTrend = this.calculateTrend(adLine.slice(-10));
    const obvTrend = this.calculateTrend(obv.slice(-10));
    const priceTrend = this.calculateTrend(data.slice(-10).map(d => d.close));
    
    // Smart money accumulation: Price declining but volume indicators rising
    if (priceTrend < -0.01 && (adTrend > 0.01 || obvTrend > 0.01)) {
      return 'ACCUMULATION';
    }
    
    // Smart money distribution: Price rising but volume indicators declining
    if (priceTrend > 0.01 && (adTrend < -0.01 || obvTrend < -0.01)) {
      return 'DISTRIBUTION';
    }
    
    return 'NEUTRAL';
  }
  
  private calculateAccumulationDistribution(data: CandlestickData[]): number[] {
    const ad: number[] = [];
    let cumulative = 0;
    
    data.forEach(candle => {
      const mfm = ((candle.close - candle.low) - (candle.high - candle.close)) / (candle.high - candle.low);
      const mfv = mfm * candle.volume;
      cumulative += isNaN(mfv) ? 0 : mfv;
      ad.push(cumulative);
    });
    
    return ad;
  }
  
  private calculateOnBalanceVolume(data: CandlestickData[]): number[] {
    const obv: number[] = [0];
    
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const current = data[i];
      let obvValue = obv[i - 1];
      
      if (current.close > prev.close) {
        obvValue += current.volume;
      } else if (current.close < prev.close) {
        obvValue -= current.volume;
      }
      
      obv.push(obvValue);
    }
    
    return obv;
  }
  
  private calculateMoneyFlowIndex(data: CandlestickData[], period: number = 14): number[] {
    const mfi: number[] = [];
    
    for (let i = period; i < data.length; i++) {
      let positiveFlow = 0;
      let negativeFlow = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const current = data[j];
        const prev = data[j - 1];
        const typical = (current.high + current.low + current.close) / 3;
        const prevTypical = (prev.high + prev.low + prev.close) / 3;
        const rawMoneyFlow = typical * current.volume;
        
        if (typical > prevTypical) {
          positiveFlow += rawMoneyFlow;
        } else if (typical < prevTypical) {
          negativeFlow += rawMoneyFlow;
        }
      }
      
      const moneyRatio = positiveFlow / (negativeFlow || 1);
      const mfiValue = 100 - (100 / (1 + moneyRatio));
      mfi.push(mfiValue);
    }
    
    return mfi;
  }
  
  private calculateVolumeWeightedRSI(data: CandlestickData[], period: number = 14): number[] {
    const vrsi: number[] = [];
    
    for (let i = period; i < data.length; i++) {
      let gainSum = 0;
      let lossSum = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const change = data[j].close - data[j - 1].close;
        const weightedChange = change * data[j].volume;
        
        if (weightedChange > 0) {
          gainSum += weightedChange;
        } else {
          lossSum += Math.abs(weightedChange);
        }
      }
      
      const rs = gainSum / (lossSum || 1);
      const rsi = 100 - (100 / (1 + rs));
      vrsi.push(rsi);
    }
    
    return vrsi;
  }
  
  private detectVolumeSpike(data: CandlestickData[]): boolean {
    if (data.length < 10) return false;
    
    const recent = data.slice(-5);
    const historical = data.slice(-20, -5);
    const recentAvg = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
    const historicalAvg = historical.reduce((sum, d) => sum + d.volume, 0) / historical.length;
    
    return recentAvg > historicalAvg * 2; // 200% increase
  }
  
  private checkVolumeConfirmation(data: CandlestickData[]): boolean {
    if (data.length < 5) return false;
    
    const recent = data.slice(-3);
    const priceDirection = recent[recent.length - 1].close > recent[0].close ? 'UP' : 'DOWN';
    const volumeTrend = this.calculateTrend(recent.map(d => d.volume));
    
    // Volume should increase in the direction of price movement
    return (priceDirection === 'UP' && volumeTrend > 0) || (priceDirection === 'DOWN' && volumeTrend > 0);
  }
  
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }
  
  private getDefaultVolumeAnalysis(): VolumeAnalysisResult {
    return {
      vwap: 0,
      volumeProfile: [],
      pocPrice: 0,
      valueAreaHigh: 0,
      valueAreaLow: 0,
      volumeQuality: 'POOR',
      smartMoneyFlow: 'NEUTRAL',
      volumeSpike: false,
      volumeConfirmation: false
    };
  }
}

export const volumeAnalysis = new VolumeAnalysis();
