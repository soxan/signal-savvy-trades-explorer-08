import { TradingSignal, CandlestickData } from '../technicalAnalysis';

export interface RiskParameters {
  maxRiskPerTrade: number; // Percentage of account
  maxDailyRisk: number;
  maxDrawdown: number;
  stopLossATRMultiplier: number;
  takeProfitATRMultiplier: number;
  positionSizeMethod: 'FIXED' | 'VOLATILITY_ADJUSTED' | 'KELLY_CRITERION';
  // New parameters for realistic trading
  minMarginUSD: number;
  maxMarginUSD: number;
  maxLeverage: number;
}

export interface EnhancedRiskMetrics {
  optimalPositionSize: number;
  dynamicStopLoss: number;
  dynamicTakeProfit: number;
  riskRewardRatio: number;
  maxAdverseExcursion: number;
  volatilityAdjustment: number;
  kellyPercentage?: number;
  drawdownProtection: boolean;
}

export interface PortfolioRisk {
  totalExposure: number;
  correlationRisk: number;
  diversificationScore: number;
  riskBudgetUtilization: number;
}

export class RiskManagement {
  private defaultParameters: RiskParameters = {
    maxRiskPerTrade: 2, // 2%
    maxDailyRisk: 6, // 6%
    maxDrawdown: 15, // 15%
    stopLossATRMultiplier: 2.0,
    takeProfitATRMultiplier: 3.0,
    positionSizeMethod: 'FIXED',
    // Realistic trading parameters
    minMarginUSD: 100,
    maxMarginUSD: 500,
    maxLeverage: 10
  };
  
  calculateEnhancedRisk(
    signal: TradingSignal,
    data: CandlestickData[],
    accountBalance: number = 10000,
    parameters: Partial<RiskParameters> = {}
  ): EnhancedRiskMetrics {
    const params = { ...this.defaultParameters, ...parameters };
    
    console.log('🛡️ Calculating realistic risk metrics...');
    
    const atr = this.calculateATR(data);
    const volatilityAdjustment = this.calculateVolatilityAdjustment(data, atr);
    
    // Calculate realistic position size based on fixed margin amounts
    const optimalPositionSize = this.calculateRealisticPositionSize(
      signal, 
      accountBalance, 
      params
    );
    
    const { dynamicStopLoss, dynamicTakeProfit } = this.calculateDynamicLevels(
      signal, 
      atr, 
      params
    );
    const riskRewardRatio = Math.abs(dynamicTakeProfit - signal.entry) / Math.abs(signal.entry - dynamicStopLoss);
    const maxAdverseExcursion = this.calculateMaxAdverseExcursion(data);
    const kellyPercentage = this.calculateKellyPercentage(signal);
    const drawdownProtection = this.assessDrawdownProtection(accountBalance);
    
    return {
      optimalPositionSize,
      dynamicStopLoss,
      dynamicTakeProfit,
      riskRewardRatio,
      maxAdverseExcursion,
      volatilityAdjustment,
      kellyPercentage,
      drawdownProtection
    };
  }
  
  private calculateRealisticPositionSize(
    signal: TradingSignal,
    accountBalance: number,
    params: RiskParameters
  ): number {
    // Use a fixed margin amount between $100-$500
    const targetMarginUSD = Math.min(
      Math.max(params.minMarginUSD, accountBalance * 0.02), // At least 2% or $100
      Math.min(params.maxMarginUSD, accountBalance * 0.05)  // At most 5% or $500
    );
    
    // Calculate position size as percentage of account
    const positionSizePercent = (targetMarginUSD / accountBalance) * 100;
    
    console.log(`💰 Calculated realistic position size: ${positionSizePercent.toFixed(2)}% ($${targetMarginUSD.toFixed(2)} margin)`);
    
    return Math.min(positionSizePercent, 5.0); // Cap at 5% maximum
  }
  
  private calculateATR(data: CandlestickData[], period: number = 14): number {
    if (data.length < period + 1) return 0;
    
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
  
  private calculateVolatilityAdjustment(data: CandlestickData[], atr: number): number {
    const recentPrices = data.slice(-20).map(d => d.close);
    const avgPrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    const volatilityPercentage = (atr / avgPrice) * 100;
    
    // Higher volatility = smaller position size adjustment
    if (volatilityPercentage > 5) return 0.5; // High volatility
    if (volatilityPercentage > 3) return 0.75; // Medium volatility
    if (volatilityPercentage > 1.5) return 1.0; // Normal volatility
    return 1.25; // Low volatility
  }
  
  private calculateOptimalPositionSize(
    signal: TradingSignal,
    atr: number,
    accountBalance: number,
    params: RiskParameters
  ): number {
    // Always use realistic position sizing now
    return this.calculateRealisticPositionSize(signal, accountBalance, params);
  }
  
  private calculateDynamicLevels(
    signal: TradingSignal,
    atr: number,
    params: RiskParameters
  ): { dynamicStopLoss: number; dynamicTakeProfit: number } {
    const isLong = signal.type === 'BUY';
    
    const dynamicStopLoss = isLong
      ? signal.entry - (atr * params.stopLossATRMultiplier)
      : signal.entry + (atr * params.stopLossATRMultiplier);
      
    const dynamicTakeProfit = isLong
      ? signal.entry + (atr * params.takeProfitATRMultiplier)
      : signal.entry - (atr * params.takeProfitATRMultiplier);
    
    return { dynamicStopLoss, dynamicTakeProfit };
  }
  
  private calculateMaxAdverseExcursion(data: CandlestickData[]): number {
    if (data.length < 10) return 0;
    
    const recent = data.slice(-10);
    const entryPrice = recent[0].close;
    
    let maxAdverse = 0;
    
    recent.forEach(candle => {
      const adverse = Math.max(
        Math.abs(candle.low - entryPrice) / entryPrice,
        Math.abs(candle.high - entryPrice) / entryPrice
      );
      maxAdverse = Math.max(maxAdverse, adverse);
    });
    
    return maxAdverse * 100; // Return as percentage
  }
  
  private calculateKellyPercentage(signal: TradingSignal): number | undefined {
    // Simplified Kelly Criterion calculation
    // In real implementation, this would use historical win rate and average win/loss
    const assumedWinRate = signal.confidence;
    const assumedAvgWin = signal.riskReward;
    const assumedAvgLoss = 1;
    
    if (assumedWinRate <= 0 || assumedWinRate >= 1) return undefined;
    
    const kelly = (assumedWinRate * assumedAvgWin - (1 - assumedWinRate) * assumedAvgLoss) / assumedAvgWin;
    
    return Math.max(0, Math.min(kelly * 100, 10)); // Cap at 10%
  }
  
  private assessDrawdownProtection(accountBalance: number): boolean {
    // This would typically check against actual account history
    // For now, we'll assume protection is active if balance suggests recent losses
    return true; // Simplified implementation
  }
  
  calculatePortfolioRisk(signals: TradingSignal[], pairs: string[]): PortfolioRisk {
    const totalExposure = signals.reduce((sum, signal) => sum + signal.positionSize, 0);
    
    // Simplified correlation risk (would need historical correlation data)
    const uniqueAssets = new Set(pairs.map(pair => pair.split('/')[0])).size;
    const correlationRisk = (pairs.length - uniqueAssets) / pairs.length * 100;
    
    const diversificationScore = Math.max(0, 100 - correlationRisk);
    const riskBudgetUtilization = (totalExposure / 100) * 100; // Assuming 100% max exposure
    
    return {
      totalExposure,
      correlationRisk,
      diversificationScore,
      riskBudgetUtilization
    };
  }
  
  shouldReducePositionSize(
    currentExposure: number,
    recentPerformance: number[],
    maxDrawdown: number
  ): boolean {
    const drawdown = this.calculateCurrentDrawdown(recentPerformance);
    const exposureThreshold = drawdown > maxDrawdown * 0.5 ? 0.5 : 1.0;
    
    return currentExposure > exposureThreshold || drawdown > maxDrawdown;
  }
  
  private calculateCurrentDrawdown(performance: number[]): number {
    if (performance.length === 0) return 0;
    
    let peak = performance[0];
    let maxDrawdown = 0;
    
    performance.forEach(value => {
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = ((peak - value) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    });
    
    return maxDrawdown;
  }
}

export const riskManagement = new RiskManagement();
