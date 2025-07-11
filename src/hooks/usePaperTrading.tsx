import { useState, useEffect, useCallback } from 'react';
import { TradingSignal } from '@/lib/technicalAnalysis';

export interface PaperTrade {
  id: string;
  signal: TradingSignal;
  pair: string;
  entryPrice: number;
  entryTime: number;
  status: 'OPEN' | 'CLOSED';
  exitPrice?: number;
  exitTime?: number;
  pnl?: number;
  pnlPercentage?: number;
  outcome?: 'WIN' | 'LOSS';
  closeReason?: 'TP_HIT' | 'SL_HIT' | 'MANUAL';
  leverage: number;
  positionSizeUSD: number;
  marginUsed: number;
  positionType: 'LONG' | 'SHORT';
  stopLoss: number;
  takeProfit: number;
  maxDrawdown?: number;
  maxProfit?: number;
  holdingTimeMinutes?: number;
  unrealizedPnL?: number;
  unrealizedPnLPercentage?: number;
  roi?: number;
  markPrice?: number;
  marginRatio?: number;
  liquidationPrice?: number;
}

export interface PaperTradingStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercentage: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  totalMarginUsed: number;
  avgHoldingTime: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  currentDrawdown: number;
  totalUnrealizedPnL: number;
  availableMargin: number;
}

const STORAGE_KEY = 'paper_trades';
const INITIAL_BALANCE = 10000;

export function usePaperTrading() {
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load trades from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setPaperTrades(data.trades || []);
        setBalance(data.balance || INITIAL_BALANCE);
      }
    } catch (error) {
      console.error('Error loading paper trades:', error);
    }
  }, []);

  // Save trades to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        trades: paperTrades,
        balance
      }));
    } catch (error) {
      console.error('Error saving paper trades:', error);
    }
  }, [paperTrades, balance]);

  const updateLiveMetrics = useCallback((currentPrices: Record<string, number>) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setPaperTrades(prev => prev.map(trade => {
      if (trade.status === 'OPEN') {
        const currentPrice = currentPrices[trade.pair];
        if (!currentPrice) return trade;

        const isLong = trade.positionType === 'LONG';
        const priceChange = isLong 
          ? (currentPrice - trade.entryPrice) / trade.entryPrice
          : (trade.entryPrice - currentPrice) / trade.entryPrice;
        
        const unrealizedPnL = trade.positionSizeUSD * priceChange;
        const unrealizedPnLPercentage = (unrealizedPnL / trade.marginUsed) * 100;
        const roi = unrealizedPnLPercentage;

        // Calculate liquidation price (simplified)
        const maintenanceMargin = 0.01; // 1% maintenance margin
        const liquidationPrice = isLong 
          ? trade.entryPrice * (1 - (1 / trade.leverage) + maintenanceMargin)
          : trade.entryPrice * (1 + (1 / trade.leverage) - maintenanceMargin);

        // Calculate margin ratio
        const marginRatio = (trade.marginUsed + unrealizedPnL) / trade.marginUsed;

        return {
          ...trade,
          unrealizedPnL,
          unrealizedPnLPercentage,
          roi,
          markPrice: currentPrice,
          marginRatio,
          liquidationPrice,
          maxDrawdown: Math.min(trade.maxDrawdown || 0, unrealizedPnL),
          maxProfit: Math.max(trade.maxProfit || 0, unrealizedPnL)
        };
      }
      return trade;
    }));
    
    setTimeout(() => setIsUpdating(false), 100);
  }, [isUpdating]);

  const openTrade = (signal: TradingSignal, pair: string, currentPrice: number) => {
    const leverage = signal.leverage || 1;
    const positionSizePercent = signal.positionSize;
    const positionSizeUSD = (balance * positionSizePercent / 100) * leverage;
    const marginUsed = balance * positionSizePercent / 100;
    
    // Calculate liquidation price
    const isLong = signal.type === 'BUY';
    const maintenanceMargin = 0.01;
    const liquidationPrice = isLong 
      ? currentPrice * (1 - (1 / leverage) + maintenanceMargin)
      : currentPrice * (1 + (1 / leverage) - maintenanceMargin);
    
    const trade: PaperTrade = {
      id: `${pair}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      signal,
      pair,
      entryPrice: currentPrice,
      entryTime: Date.now(),
      status: 'OPEN',
      leverage,
      positionSizeUSD,
      marginUsed,
      positionType: signal.type === 'BUY' ? 'LONG' : 'SHORT',
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
      roi: 0,
      markPrice: currentPrice,
      marginRatio: 1,
      liquidationPrice
    };

    setPaperTrades(prev => [...prev, trade]);
    
    if ((window as any).addSystemNotification) {
      (window as any).addSystemNotification({
        type: 'PAPER_TRADE',
        title: `📊 Paper Trade Opened`,
        message: `${signal.type} ${pair} at $${currentPrice.toFixed(6)} | ${leverage}x leverage | $${marginUsed.toFixed(2)} margin`,
        severity: 'MEDIUM'
      });
    }

    console.log(`✅ Opened ${signal.type} trade for ${pair}:`, {
      entryPrice: currentPrice,
      leverage,
      positionSize: positionSizeUSD,
      marginUsed,
      liquidationPrice: liquidationPrice.toFixed(6)
    });

    return trade;
  };

  const closeTrade = (tradeId: string, exitPrice: number, closeReason: PaperTrade['closeReason'] = 'MANUAL') => {
    setPaperTrades(prev => prev.map(trade => {
      if (trade.id === tradeId && trade.status === 'OPEN') {
        const holdingTimeMinutes = Math.floor((Date.now() - trade.entryTime) / (1000 * 60));
        const isLong = trade.positionType === 'LONG';
        
        const priceChange = isLong 
          ? (exitPrice - trade.entryPrice) / trade.entryPrice
          : (trade.entryPrice - exitPrice) / trade.entryPrice;
        
        const pnl = trade.positionSizeUSD * priceChange;
        const pnlPercentage = (pnl / trade.marginUsed) * 100;
        const outcome: 'WIN' | 'LOSS' = pnl > 0 ? 'WIN' : 'LOSS';

        setBalance(prev => prev + pnl);

        if ((window as any).addSystemNotification) {
          (window as any).addSystemNotification({
            type: 'PAPER_TRADE',
            title: `📊 Trade Closed: ${outcome}`,
            message: `${trade.pair} closed at $${exitPrice.toFixed(6)} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`,
            severity: outcome === 'WIN' ? 'LOW' : 'HIGH'
          });
        }

        return {
          ...trade,
          status: 'CLOSED' as const,
          exitPrice,
          exitTime: Date.now(),
          pnl,
          pnlPercentage,
          outcome,
          closeReason,
          holdingTimeMinutes,
          roi: pnlPercentage
        };
      }
      return trade;
    }));
  };

  const checkStopLossAndTakeProfit = (currentPrices: Record<string, number>) => {
    paperTrades.forEach(trade => {
      if (trade.status === 'OPEN') {
        const currentPrice = currentPrices[trade.pair];
        if (!currentPrice) return;

        const isLong = trade.positionType === 'LONG';

        // Check liquidation
        if ((isLong && currentPrice <= (trade.liquidationPrice || 0)) || 
            (!isLong && currentPrice >= (trade.liquidationPrice || Infinity))) {
          console.log(`💥 Liquidation triggered for ${trade.pair} at $${currentPrice}`);
          closeTrade(trade.id, trade.liquidationPrice || currentPrice, 'SL_HIT');
          return;
        }

        // Check Stop Loss
        if ((isLong && currentPrice <= trade.stopLoss) || 
            (!isLong && currentPrice >= trade.stopLoss)) {
          console.log(`🛑 Stop Loss triggered for ${trade.pair} at $${currentPrice}`);
          closeTrade(trade.id, trade.stopLoss, 'SL_HIT');
        }
        // Check Take Profit
        else if ((isLong && currentPrice >= trade.takeProfit) || 
                 (!isLong && currentPrice <= trade.takeProfit)) {
          console.log(`🎯 Take Profit triggered for ${trade.pair} at $${currentPrice}`);
          closeTrade(trade.id, trade.takeProfit, 'TP_HIT');
        }
      }
    });
  };

  const calculateStats = (): PaperTradingStats => {
    const closedTrades = paperTrades.filter(t => t.status === 'CLOSED');
    const openTrades = paperTrades.filter(t => t.status === 'OPEN');
    const wins = closedTrades.filter(t => t.outcome === 'WIN');
    const losses = closedTrades.filter(t => t.outcome === 'LOSS');

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalUnrealizedPnL = openTrades.reduce((sum, t) => sum + (t.unrealizedPnL || 0), 0);
    const winPnLs = wins.map(t => t.pnl || 0);
    const lossPnLs = losses.map(t => Math.abs(t.pnl || 0));
    
    const grossProfit = winPnLs.reduce((sum, pnl) => sum + pnl, 0);
    const grossLoss = lossPnLs.reduce((sum, pnl) => sum + pnl, 0);
    
    const totalMarginUsed = openTrades.reduce((sum, t) => sum + t.marginUsed, 0);
    const availableMargin = balance - totalMarginUsed;
    const avgHoldingTime = closedTrades.length > 0 
      ? closedTrades.reduce((sum, t) => sum + (t.holdingTimeMinutes || 0), 0) / closedTrades.length
      : 0;

    const allDrawdowns = [...closedTrades, ...openTrades].map(t => t.maxDrawdown || 0).filter(d => d < 0);
    const maxDrawdown = allDrawdowns.length > 0 ? Math.min(...allDrawdowns) : 0;
    const currentDrawdown = totalUnrealizedPnL < 0 ? totalUnrealizedPnL : 0;

    return {
      totalTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalPnL: totalPnL || 0,
      totalPnLPercentage: ((balance - INITIAL_BALANCE) / INITIAL_BALANCE) * 100,
      avgWin: winPnLs.length > 0 ? winPnLs.reduce((a, b) => a + b, 0) / winPnLs.length : 0,
      avgLoss: lossPnLs.length > 0 ? lossPnLs.reduce((a, b) => a + b, 0) / lossPnLs.length : 0,
      largestWin: winPnLs.length > 0 ? Math.max(...winPnLs) : 0,
      largestLoss: lossPnLs.length > 0 ? Math.max(...lossPnLs) : 0,
      totalMarginUsed: totalMarginUsed || 0,
      avgHoldingTime: avgHoldingTime || 0,
      maxDrawdown: maxDrawdown || 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
      sharpeRatio: 0,
      currentDrawdown,
      totalUnrealizedPnL,
      availableMargin
    };
  };

  const resetPaperTrading = () => {
    setPaperTrades([]);
    setBalance(INITIAL_BALANCE);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    paperTrades,
    balance,
    openTrades: paperTrades.filter(t => t.status === 'OPEN'),
    closedTrades: paperTrades.filter(t => t.status === 'CLOSED'),
    openTrade,
    closeTrade,
    checkStopLossAndTakeProfit,
    updateLiveMetrics,
    calculateStats: calculateStats(),
    resetPaperTrading
  };
}
