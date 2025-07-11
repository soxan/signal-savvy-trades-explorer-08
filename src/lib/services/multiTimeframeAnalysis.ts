
import { CandlestickData, TechnicalAnalysis } from '../technicalAnalysis';
import { marketDataService } from './marketDataService';

export interface TimeframeData {
  timeframe: string;
  data: CandlestickData[];
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  indicators: any;
}

export interface MultiTimeframeSignal {
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  confluence: number;
  timeframes: TimeframeData[];
  overallTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class MultiTimeframeAnalysis {
  private ta = new TechnicalAnalysis();
  private timeframes = ['5m', '15m', '1h', '4h', '1d'];
  
  async analyzeMultipleTimeframes(symbol: string): Promise<MultiTimeframeSignal> {
    console.log(`🔄 Multi-timeframe analysis for ${symbol}`);
    
    const timeframeData: TimeframeData[] = [];
    
    // Fetch data for all timeframes
    for (const tf of this.timeframes) {
      try {
        const data = await marketDataService.getCandlestickData(symbol, tf, 100);
        if (data && data.length > 50) {
          const analysis = this.analyzeTimeframe(data, tf);
          timeframeData.push(analysis);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch ${tf} data for ${symbol}:`, error);
      }
    }
    
    return this.generateMultiTimeframeSignal(timeframeData);
  }
  
  private analyzeTimeframe(data: CandlestickData[], timeframe: string): TimeframeData {
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    
    const indicators = {
      rsi: this.ta.calculateRSI(closes, 14),
      macd: this.ta.calculateMACD(closes),
      sma20: this.ta.calculateSMA(closes, 20),
      sma50: this.ta.calculateSMA(closes, 50),
      ema12: this.ta.calculateEMA(closes, 12),
      ema26: this.ta.calculateEMA(closes, 26),
      bb: this.ta.calculateBollingerBands(closes),
      atr: this.ta.calculateATR(highs, lows, closes)
    };
    
    const trend = this.determineTrend(data, indicators);
    const strength = this.calculateTrendStrength(data, indicators);
    
    return {
      timeframe,
      data,
      trend,
      strength,
      indicators
    };
  }
  
  private determineTrend(data: CandlestickData[], indicators: any): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const latest = data[data.length - 1];
    const sma20 = indicators.sma20[indicators.sma20.length - 1];
    const sma50 = indicators.sma50[indicators.sma50.length - 1];
    const macd = indicators.macd[indicators.macd.length - 1];
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // Price vs SMAs
    if (latest.close > sma20) bullishSignals++;
    else bearishSignals++;
    
    if (sma20 > sma50) bullishSignals++;
    else bearishSignals++;
    
    // MACD
    if (macd && macd.macd > macd.signal) bullishSignals++;
    else if (macd) bearishSignals++;
    
    // Higher highs/Lower lows
    const recentHighs = data.slice(-10).map(d => d.high);
    const recentLows = data.slice(-10).map(d => d.low);
    const isHHs = recentHighs[recentHighs.length - 1] > recentHighs[0];
    const isLLs = recentLows[recentLows.length - 1] < recentLows[0];
    
    if (isHHs) bullishSignals++;
    if (isLLs) bearishSignals++;
    
    if (bullishSignals > bearishSignals + 1) return 'BULLISH';
    if (bearishSignals > bullishSignals + 1) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  private calculateTrendStrength(data: CandlestickData[], indicators: any): number {
    const atr = indicators.atr[indicators.atr.length - 1];
    const recentRange = data.slice(-20);
    const priceChange = (recentRange[recentRange.length - 1].close - recentRange[0].close) / recentRange[0].close;
    const normalizedChange = Math.abs(priceChange) / (atr / recentRange[0].close);
    
    return Math.min(normalizedChange * 100, 100);
  }
  
  private generateMultiTimeframeSignal(timeframeData: TimeframeData[]): MultiTimeframeSignal {
    if (timeframeData.length === 0) {
      return {
        direction: 'NEUTRAL',
        confluence: 0,
        timeframes: [],
        overallTrend: 'NEUTRAL',
        riskLevel: 'HIGH'
      };
    }
    
    let bullishCount = 0;
    let bearishCount = 0;
    let totalStrength = 0;
    
    // Weight higher timeframes more heavily
    const weights = { '1d': 5, '4h': 4, '1h': 3, '15m': 2, '5m': 1 };
    
    timeframeData.forEach(tf => {
      const weight = weights[tf.timeframe as keyof typeof weights] || 1;
      totalStrength += tf.strength * weight;
      
      if (tf.trend === 'BULLISH') bullishCount += weight;
      else if (tf.trend === 'BEARISH') bearishCount += weight;
    });
    
    const totalWeight = timeframeData.reduce((sum, tf) => sum + (weights[tf.timeframe as keyof typeof weights] || 1), 0);
    const confluence = Math.abs(bullishCount - bearishCount) / totalWeight * 100;
    
    let direction: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (bullishCount > bearishCount && confluence > 60) direction = 'BUY';
    else if (bearishCount > bullishCount && confluence > 60) direction = 'SELL';
    
    const overallTrend = bullishCount > bearishCount ? 'BULLISH' : bearishCount > bullishCount ? 'BEARISH' : 'NEUTRAL';
    const riskLevel = confluence > 80 ? 'LOW' : confluence > 60 ? 'MEDIUM' : 'HIGH';
    
    console.log(`📊 Multi-timeframe confluence: ${confluence.toFixed(1)}% - ${direction}`);
    
    return {
      direction,
      confluence,
      timeframes: timeframeData,
      overallTrend,
      riskLevel
    };
  }
}

export const multiTimeframeAnalysis = new MultiTimeframeAnalysis();
