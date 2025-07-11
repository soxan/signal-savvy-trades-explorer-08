
import { useState, useCallback } from 'react';
import { TradingSignal, CandlestickData } from '@/lib/technicalAnalysis';
import { SignalProcessor } from '@/lib/services/signalProcessor';
import { MarketData } from '@/lib/types/marketData';

export interface BacktestTrade {
  id: string;
  signal: TradingSignal;
  pair: string;
  entryPrice: number;
  entryTime: number;
  exitPrice?: number;
  exitTime?: number;
  status: 'OPEN' | 'CLOSED';
  outcome?: 'WIN' | 'LOSS';
  pnl?: number;
  pnlPercentage?: number;
  holdingPeriod?: number;
  closeReason?: 'TP_HIT' | 'SL_HIT' | 'TIME_STOP' | 'SIGNAL_REVERSE';
  leverage: number;
  positionSize: number;
  fees: number;
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercentage: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  avgHoldingPeriod: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalFees: number;
  roi: number;
  calmarRatio: number;
  trades: BacktestTrade[];
  equityCurve: { timestamp: number; equity: number; drawdown: number }[];
  monthlyReturns: { month: string; return: number; trades: number }[];
}

export interface BacktestConfig {
  initialBalance: number;
  positionSizing: 'FIXED' | 'PERCENTAGE' | 'KELLY';
  positionSizeValue: number;
  maxOpenPositions: number;
  enableLeverage: boolean;
  maxLeverage: number;
  stopLossType: 'ATR' | 'PERCENTAGE' | 'SIGNAL';
  takeProfitType: 'ATR' | 'PERCENTAGE' | 'SIGNAL';
  slippage: number;
  commission: number;
  timeStopHours?: number;
}

export function useBacktestEngine() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = useCallback(async (
    candlestickData: CandlestickData[],
    pair: string,
    config: BacktestConfig,
    startDate?: Date,
    endDate?: Date
  ): Promise<BacktestResults> => {
    setIsRunning(true);
    setProgress(0);
    setError(null);

    try {
      console.log('🚀 Starting comprehensive backtest analysis...', {
        pair,
        dataPoints: candlestickData.length,
        config,
        dateRange: { start: startDate, end: endDate }
      });

      // Filter data by date range if provided
      let filteredData = candlestickData;
      if (startDate || endDate) {
        filteredData = candlestickData.filter(candle => {
          const candleDate = new Date(candle.timestamp);
          if (startDate && candleDate < startDate) return false;
          if (endDate && candleDate > endDate) return false;
          return true;
        });
      }

      if (filteredData.length < 50) {
        throw new Error('Insufficient data for backtesting (minimum 50 candles required)');
      }

      const signalProcessor = new SignalProcessor();
      const trades: BacktestTrade[] = [];
      const equityCurve: { timestamp: number; equity: number; drawdown: number }[] = [];
      
      let currentBalance = config.initialBalance;
      let peakBalance = config.initialBalance;
      let maxDrawdown = 0;
      let openTrades: BacktestTrade[] = [];
      let tradeCounter = 0;

      // Process each candle for signals and trade management
      for (let i = 50; i < filteredData.length; i++) {
        const currentCandle = filteredData[i];
        const historicalData = filteredData.slice(0, i + 1);
        
        setProgress((i / filteredData.length) * 100);

        // Generate signal using the actual system
        try {
          const signal = await signalProcessor.processStandardSignal(
            historicalData.slice(-200), // Use last 200 candles for analysis
            pair
          );

          // Check for new trade entry
          if (signal.type !== 'NEUTRAL' && 
              openTrades.length < config.maxOpenPositions &&
              signal.confidence >= 0.1) { // Minimum confidence threshold
            
            const leverage = config.enableLeverage ? 
              Math.min(signal.leverage || 1, config.maxLeverage) : 1;
            
            // Calculate position size
            let positionSize = 0;
            switch (config.positionSizing) {
              case 'FIXED':
                positionSize = config.positionSizeValue;
                break;
              case 'PERCENTAGE':
                positionSize = (currentBalance * config.positionSizeValue / 100) * leverage;
                break;
              case 'KELLY':
                // Simplified Kelly criterion
                const winRate = trades.length > 10 ? 
                  trades.filter(t => t.outcome === 'WIN').length / trades.length : 0.5;
                const avgWin = trades.filter(t => t.outcome === 'WIN')
                  .reduce((sum, t) => sum + (t.pnlPercentage || 0), 0) / 
                  Math.max(1, trades.filter(t => t.outcome === 'WIN').length);
                const avgLoss = Math.abs(trades.filter(t => t.outcome === 'LOSS')
                  .reduce((sum, t) => sum + (t.pnlPercentage || 0), 0) / 
                  Math.max(1, trades.filter(t => t.outcome === 'LOSS').length));
                
                const kellyPercent = winRate - ((1 - winRate) / (avgWin / avgLoss));
                positionSize = Math.max(0, Math.min(0.25, kellyPercent)) * currentBalance * leverage;
                break;
            }

            // Apply slippage to entry price
            const slippageMultiplier = signal.type === 'BUY' ? 
              (1 + config.slippage / 100) : (1 - config.slippage / 100);
            const entryPrice = currentCandle.close * slippageMultiplier;
            
            // Calculate fees
            const fees = positionSize * (config.commission / 100);
            
            // Create trade
            const trade: BacktestTrade = {
              id: `${pair}-${tradeCounter++}`,
              signal,
              pair,
              entryPrice,
              entryTime: currentCandle.timestamp,
              status: 'OPEN',
              leverage,
              positionSize,
              fees
            };

            openTrades.push(trade);
            currentBalance -= fees; // Deduct entry fees
            
            console.log(`📈 ${signal.type} trade opened at $${entryPrice.toFixed(6)} | Size: $${positionSize.toFixed(2)} | ${leverage}x leverage`);
          }

          // Check exit conditions for open trades
          openTrades = openTrades.filter(trade => {
            const currentPrice = currentCandle.close;
            const isLong = trade.signal.type === 'BUY';
            let shouldClose = false;
            let closeReason: BacktestTrade['closeReason'] = 'TIME_STOP';

            // Check stop loss
            if ((isLong && currentPrice <= trade.signal.stopLoss) ||
                (!isLong && currentPrice >= trade.signal.stopLoss)) {
              shouldClose = true;
              closeReason = 'SL_HIT';
            }
            
            // Check take profit
            if ((isLong && currentPrice >= trade.signal.takeProfit) ||
                (!isLong && currentPrice <= trade.signal.takeProfit)) {
              shouldClose = true;
              closeReason = 'TP_HIT';
            }

            // Check time stop
            if (config.timeStopHours) {
              const hoursOpen = (currentCandle.timestamp - trade.entryTime) / (1000 * 60 * 60);
              if (hoursOpen >= config.timeStopHours) {
                shouldClose = true;
                closeReason = 'TIME_STOP';
              }
            }

            // Check signal reversal
            if (signal.type !== 'NEUTRAL' && 
                ((trade.signal.type === 'BUY' && signal.type === 'SELL') ||
                 (trade.signal.type === 'SELL' && signal.type === 'BUY'))) {
              shouldClose = true;
              closeReason = 'SIGNAL_REVERSE';
            }

            if (shouldClose) {
              // Apply slippage to exit price
              const slippageMultiplier = isLong ? 
                (1 - config.slippage / 100) : (1 + config.slippage / 100);
              const exitPrice = currentPrice * slippageMultiplier;
              
              // Calculate P&L
              const priceChange = isLong ? 
                (exitPrice - trade.entryPrice) / trade.entryPrice :
                (trade.entryPrice - exitPrice) / trade.entryPrice;
              
              const grossPnl = trade.positionSize * priceChange;
              const exitFees = trade.positionSize * (config.commission / 100);
              const netPnl = grossPnl - exitFees;
              const pnlPercentage = (netPnl / (trade.positionSize / trade.leverage)) * 100;
              
              // Close trade
              const closedTrade: BacktestTrade = {
                ...trade,
                status: 'CLOSED',
                exitPrice,
                exitTime: currentCandle.timestamp,
                pnl: netPnl,
                pnlPercentage,
                outcome: netPnl > 0 ? 'WIN' : 'LOSS',
                holdingPeriod: currentCandle.timestamp - trade.entryTime,
                closeReason,
                fees: trade.fees + exitFees
              };

              trades.push(closedTrade);
              currentBalance += netPnl;
              
              console.log(`${netPnl > 0 ? '✅' : '❌'} Trade closed: ${closedTrade.outcome} | P&L: $${netPnl.toFixed(2)} | Reason: ${closeReason}`);
              
              return false; // Remove from open trades
            }

            return true; // Keep trade open
          });

          // Update equity curve and drawdown
          if (currentBalance > peakBalance) {
            peakBalance = currentBalance;
          }
          
          const currentDrawdown = peakBalance - currentBalance;
          const currentDrawdownPercentage = (currentDrawdown / peakBalance) * 100;
          
          if (currentDrawdown > maxDrawdown) {
            maxDrawdown = currentDrawdown;
          }

          equityCurve.push({
            timestamp: currentCandle.timestamp,
            equity: currentBalance,
            drawdown: currentDrawdownPercentage
          });

        } catch (signalError) {
          console.warn(`⚠️ Signal generation failed for candle ${i}:`, signalError);
        }
      }

      // Close any remaining open trades at the end
      const finalCandle = filteredData[filteredData.length - 1];
      openTrades.forEach(trade => {
        const currentPrice = finalCandle.close;
        const isLong = trade.signal.type === 'BUY';
        const exitPrice = currentPrice;
        
        const priceChange = isLong ? 
          (exitPrice - trade.entryPrice) / trade.entryPrice :
          (trade.entryPrice - exitPrice) / trade.entryPrice;
        
        const grossPnl = trade.positionSize * priceChange;
        const exitFees = trade.positionSize * (config.commission / 100);
        const netPnl = grossPnl - exitFees;
        
        const closedTrade: BacktestTrade = {
          ...trade,
          status: 'CLOSED',
          exitPrice,
          exitTime: finalCandle.timestamp,
          pnl: netPnl,
          pnlPercentage: (netPnl / (trade.positionSize / trade.leverage)) * 100,
          outcome: netPnl > 0 ? 'WIN' : 'LOSS',
          holdingPeriod: finalCandle.timestamp - trade.entryTime,
          closeReason: 'TIME_STOP',
          fees: trade.fees + exitFees
        };

        trades.push(closedTrade);
        currentBalance += netPnl;
      });

      // Calculate comprehensive results
      const results = calculateBacktestResults(trades, config.initialBalance, currentBalance, maxDrawdown, equityCurve);
      
      console.log('✅ Backtest completed successfully:', {
        totalTrades: results.totalTrades,
        winRate: results.winRate.toFixed(2) + '%',
        totalReturn: results.totalReturnPercentage.toFixed(2) + '%',
        maxDrawdown: results.maxDrawdownPercentage.toFixed(2) + '%',
        sharpeRatio: results.sharpeRatio.toFixed(2)
      });

      setResults(results);
      setProgress(100);
      
      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during backtesting';
      console.error('❌ Backtest failed:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    runBacktest,
    isRunning,
    progress,
    results,
    error,
    clearResults: () => setResults(null)
  };
}

function calculateBacktestResults(
  trades: BacktestTrade[],
  initialBalance: number,
  finalBalance: number,
  maxDrawdown: number,
  equityCurve: { timestamp: number; equity: number; drawdown: number }[]
): BacktestResults {
  const winningTrades = trades.filter(t => t.outcome === 'WIN');
  const losingTrades = trades.filter(t => t.outcome === 'LOSS');
  
  const totalReturn = finalBalance - initialBalance;
  const totalReturnPercentage = (totalReturn / initialBalance) * 100;
  const maxDrawdownPercentage = (maxDrawdown / initialBalance) * 100;
  
  const avgWin = winningTrades.length > 0 ? 
    winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? 
    Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losingTrades.length : 0;
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
  
  // Calculate Sharpe ratio (simplified)
  const returns = equityCurve.map((point, i) => i > 0 ? 
    (point.equity - equityCurve[i-1].equity) / equityCurve[i-1].equity : 0
  ).slice(1);
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const returnStdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0;
  
  // Calculate consecutive wins/losses
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let currentConsecutiveWins = 0;
  let currentConsecutiveLosses = 0;
  
  trades.forEach(trade => {
    if (trade.outcome === 'WIN') {
      currentConsecutiveWins++;
      currentConsecutiveLosses = 0;
      consecutiveWins = Math.max(consecutiveWins, currentConsecutiveWins);
    } else {
      currentConsecutiveLosses++;
      currentConsecutiveWins = 0;
      consecutiveLosses = Math.max(consecutiveLosses, currentConsecutiveLosses);
    }
  });
  
  // Calculate monthly returns
  const monthlyReturns: { month: string; return: number; trades: number }[] = [];
  const monthlyData = new Map<string, { return: number; trades: number }>();
  
  trades.forEach(trade => {
    if (trade.exitTime) {
      const date = new Date(trade.exitTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { return: 0, trades: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      monthData.return += (trade.pnl || 0);
      monthData.trades += 1;
    }
  });
  
  monthlyData.forEach((data, month) => {
    monthlyReturns.push({
      month,
      return: data.return,
      trades: data.trades
    });
  });

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    totalReturn,
    totalReturnPercentage,
    maxDrawdown,
    maxDrawdownPercentage,
    sharpeRatio,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
    avgWin,
    avgLoss,
    avgHoldingPeriod: trades.length > 0 ? 
      trades.reduce((sum, t) => sum + (t.holdingPeriod || 0), 0) / trades.length : 0,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0,
    consecutiveWins,
    consecutiveLosses,
    totalFees: trades.reduce((sum, t) => sum + t.fees, 0),
    roi: totalReturnPercentage,
    calmarRatio: maxDrawdownPercentage > 0 ? totalReturnPercentage / maxDrawdownPercentage : 0,
    trades,
    equityCurve,
    monthlyReturns
  };
}
