import { useState, useEffect, useCallback } from 'react';
import { TradingSignal } from '@/lib/technicalAnalysis';

export interface SignalPerformance {
  id: string;
  signal: TradingSignal;
  pair: string;
  timestamp: number;
  outcome: 'WIN' | 'LOSS' | 'PENDING';
  actualReturn?: number;
  daysHeld?: number;
  entryPrice?: number;
  exitPrice?: number;
  exitReason?: 'TP_HIT' | 'SL_HIT' | 'EXPIRED' | 'MANUAL';
}

export interface PerformanceMetrics {
  totalSignals: number;
  completedSignals: number;
  winRate: number;
  avgReturn: number;
  avgWin: number;
  avgLoss: number;
  bestSignal: SignalPerformance | null;
  worstSignal: SignalPerformance | null;
  recentPerformance: SignalPerformance[];
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

const STORAGE_KEY = 'signal_performance_tracking';
const MAX_STORED_PERFORMANCE = 1000;

export function useSignalPerformanceTracking() {
  const [performanceData, setPerformanceData] = useState<SignalPerformance[]>([]);

  // Load performance data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as SignalPerformance[];
        setPerformanceData(data);
        console.log(`📊 Loaded ${data.length} signal performance records`);
      }
    } catch (error) {
      console.error('❌ Error loading performance data:', error);
    }
  }, []);

  // Save performance data to localStorage
  useEffect(() => {
    if (performanceData.length > 0) {
      try {
        // Keep only the most recent records
        const trimmedData = performanceData.slice(-MAX_STORED_PERFORMANCE);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedData));
        console.log(`💾 Saved ${trimmedData.length} performance records`);
      } catch (error) {
        console.error('❌ Error saving performance data:', error);
      }
    }
  }, [performanceData]);

  const trackSignalPerformance = useCallback((signal: TradingSignal, pair: string) => {
    if (signal.type === 'NEUTRAL') return;

    // Check if signal is already being tracked
    const existingRecord = performanceData.find(p => 
      p.pair === pair && 
      p.signal.type === signal.type &&
      Math.abs(p.timestamp - Date.now()) < 10000 // Within 10 seconds
    );

    if (existingRecord) {
      console.log(`⚠️ Signal for ${pair} already being tracked`);
      return;
    }

    const performanceRecord: SignalPerformance = {
      id: `${pair}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      signal,
      pair,
      timestamp: Date.now(),
      outcome: 'PENDING',
      entryPrice: signal.entry
    };

    setPerformanceData(prev => [...prev, performanceRecord]);
    console.log(`📈 Started tracking performance for ${signal.type} signal on ${pair} at ${signal.entry}`);
  }, [performanceData]);

  const updateSignalOutcome = useCallback((
    id: string, 
    outcome: 'WIN' | 'LOSS', 
    actualReturn?: number, 
    exitPrice?: number,
    exitReason?: SignalPerformance['exitReason']
  ) => {
    setPerformanceData(prev => prev.map(record => {
      if (record.id === id) {
        const daysHeld = (Date.now() - record.timestamp) / (1000 * 60 * 60 * 24);
        const updatedRecord = {
          ...record,
          outcome,
          actualReturn: actualReturn || (outcome === 'WIN' ? record.signal.riskReward * 2 : -2),
          exitPrice: exitPrice || (outcome === 'WIN' ? record.signal.takeProfit : record.signal.stopLoss),
          exitReason: exitReason || (outcome === 'WIN' ? 'TP_HIT' : 'SL_HIT'),
          daysHeld
        };
        
        console.log(`📊 Updated signal ${id}: ${outcome} with ${updatedRecord.actualReturn}% return`);
        return updatedRecord;
      }
      return record;
    }));
  }, []);

  const getPerformanceMetrics = useCallback((pair?: string): PerformanceMetrics => {
    const filteredData = pair ? performanceData.filter(p => p.pair === pair) : performanceData;
    const completedSignals = filteredData.filter(p => p.outcome !== 'PENDING');
    const winningSignals = completedSignals.filter(p => p.outcome === 'WIN');
    const losingSignals = completedSignals.filter(p => p.outcome === 'LOSS');
    
    const totalSignals = filteredData.length;
    const winRate = completedSignals.length > 0 ? (winningSignals.length / completedSignals.length) * 100 : 0;
    
    // Calculate returns
    const returns = completedSignals.map(p => p.actualReturn || 0);
    const winReturns = winningSignals.map(p => p.actualReturn || 0);
    const lossReturns = losingSignals.map(p => p.actualReturn || 0);
    
    const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const avgWin = winReturns.length > 0 ? winReturns.reduce((sum, r) => sum + r, 0) / winReturns.length : 0;
    const avgLoss = lossReturns.length > 0 ? Math.abs(lossReturns.reduce((sum, r) => sum + r, 0) / lossReturns.length) : 0;
    
    // Profit factor calculation
    const totalWinAmount = winReturns.reduce((sum, r) => sum + r, 0);
    const totalLossAmount = Math.abs(lossReturns.reduce((sum, r) => sum + r, 0));
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;
    
    // Best and worst signals
    const bestSignal = completedSignals.reduce((best, current) => 
      !best || (current.actualReturn || 0) > (best.actualReturn || 0) ? current : best, 
      null as SignalPerformance | null
    );

    const worstSignal = completedSignals.reduce((worst, current) => 
      !worst || (current.actualReturn || 0) < (worst.actualReturn || 0) ? current : worst, 
      null as SignalPerformance | null
    );

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    
    completedSignals.forEach(signal => {
      runningTotal += (signal.actualReturn || 0);
      if (runningTotal > peak) {
        peak = runningTotal;
      } else {
        const drawdown = peak - runningTotal;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    });

    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    completedSignals.forEach(signal => {
      if (signal.outcome === 'WIN') {
        currentWinStreak++;
        currentLossStreak = 0;
        consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
      }
    });

    // Simple Sharpe ratio calculation (assuming risk-free rate of 0)
    const returnStdDev = returns.length > 1 ? 
      Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)) : 0;
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    const recentPerformance = filteredData
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      totalSignals,
      completedSignals: completedSignals.length,
      winRate,
      avgReturn,
      avgWin,
      avgLoss,
      bestSignal,
      worstSignal,
      recentPerformance,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      consecutiveWins,
      consecutiveLosses
    };
  }, [performanceData]);

  const clearPerformanceData = useCallback(() => {
    setPerformanceData([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared all performance tracking data');
  }, []);

  return {
    performanceData,
    trackSignalPerformance,
    updateSignalOutcome,
    getPerformanceMetrics,
    clearPerformanceData
  };
}
