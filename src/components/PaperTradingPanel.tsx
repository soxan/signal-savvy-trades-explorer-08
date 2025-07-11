import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Target, X, Play, RotateCcw, Clock, Zap, Shield, AlertTriangle, Activity } from 'lucide-react';
import { usePaperTrading, PaperTrade } from '@/hooks/usePaperTrading';
import { TradingSignal } from '@/lib/technicalAnalysis';
import { MarketData } from '@/lib/dataService';
import { useEffect } from 'react';

interface PaperTradingPanelProps {
  currentSignal: TradingSignal | null;
  selectedPair: string;
  selectedMarketData: MarketData | undefined;
  marketData: MarketData[];
}

export function PaperTradingPanel({ 
  currentSignal, 
  selectedPair, 
  selectedMarketData,
  marketData 
}: PaperTradingPanelProps) {
  const {
    paperTrades,
    balance,
    openTrades,
    closedTrades,
    openTrade,
    closeTrade,
    checkStopLossAndTakeProfit,
    updateLiveMetrics,
    calculateStats,
    resetPaperTrading
  } = usePaperTrading();

  // Live price updates every second (like Binance)
  useEffect(() => {
    if (marketData && marketData.length > 0 && openTrades.length > 0) {
      const priceMap = marketData.reduce((acc, data) => {
        acc[data.symbol] = data.price;
        return acc;
      }, {} as Record<string, number>);
      
      // Update live metrics
      updateLiveMetrics(priceMap);
      
      // Check SL/TP
      checkStopLossAndTakeProfit(priceMap);
    }
  }, [marketData, openTrades.length, updateLiveMetrics, checkStopLossAndTakeProfit]);

  const handleOpenTrade = () => {
    if (currentSignal && selectedMarketData && currentSignal.type !== 'NEUTRAL') {
      openTrade(currentSignal, selectedPair, selectedMarketData.price);
    }
  };

  const handleCloseTrade = (tradeId: string) => {
    const trade = openTrades.find(t => t.id === tradeId);
    if (trade) {
      const currentPrice = marketData.find(m => m.symbol === trade.pair)?.price;
      if (currentPrice) {
        closeTrade(tradeId, currentPrice, 'MANUAL');
      }
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null || isNaN(amount)) {
      return '0.00';
    }
    
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return (amount / 1000000).toFixed(2) + 'M';
    }
    if (absAmount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toFixed(2);
  };

  const formatPnL = (pnl: number | undefined | null, showSign: boolean = true) => {
    if (pnl == null || isNaN(pnl)) {
      return <span className="text-muted-foreground">$0.00</span>;
    }
    
    const isPositive = pnl >= 0;
    return (
      <span className={isPositive ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
        {showSign && isPositive ? '+' : ''}${formatCurrency(pnl)}
      </span>
    );
  };

  const formatPercentage = (percentage: number | undefined | null) => {
    if (percentage == null || isNaN(percentage)) {
      return <span className="text-muted-foreground">0.00%</span>;
    }
    
    const isPositive = percentage >= 0;
    return (
      <span className={isPositive ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
        {isPositive ? '+' : ''}{percentage.toFixed(2)}%
      </span>
    );
  };

  const getRiskLevel = (marginRatio: number) => {
    if (marginRatio > 0.8) return { level: 'LOW', color: 'text-green-500' };
    if (marginRatio > 0.5) return { level: 'MEDIUM', color: 'text-yellow-500' };
    if (marginRatio > 0.2) return { level: 'HIGH', color: 'text-orange-500' };
    return { level: 'CRITICAL', color: 'text-red-500' };
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Balance and Stats Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Paper Trading Dashboard
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-muted-foreground">Live</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetPaperTrading}
                className="text-red-500 hover:text-red-600"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border">
              <div className="text-2xl font-bold">${formatCurrency(calculateStats.availableMargin)}</div>
              <div className="text-sm text-muted-foreground">Available Margin</div>
              <div className="text-xs text-blue-500 mt-1">
                Total: ${formatCurrency(balance)}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border">
              <div className="text-2xl font-bold">${formatCurrency(calculateStats.totalMarginUsed)}</div>
              <div className="text-sm text-muted-foreground">Margin Used</div>
              <div className={`text-xs mt-1 ${calculateStats.totalMarginUsed > balance * 0.8 ? 'text-red-500' : 'text-orange-500'}`}>
                {((calculateStats.totalMarginUsed / balance) * 100).toFixed(1)}% Used
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border">
              <div className="text-2xl font-bold">
                {formatPnL(calculateStats.totalPnL + calculateStats.totalUnrealizedPnL, false)}
              </div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
              <div className="text-xs mt-1">
                {formatPercentage(calculateStats.totalPnLPercentage)}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border">
              <div className="text-2xl font-bold">
                {(calculateStats.winRate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-xs text-purple-500 mt-1">
                {calculateStats.totalTrades} trades
              </div>
            </div>
          </div>

          {/* Live Stats Row */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4 text-sm">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-bold">{formatPnL(calculateStats.totalUnrealizedPnL, false)}</div>
              <div className="text-xs text-muted-foreground">Unrealized P&L</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-bold">{(calculateStats.profitFactor || 0).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Profit Factor</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-bold">{(calculateStats.avgHoldingTime || 0).toFixed(0)}m</div>
              <div className="text-xs text-muted-foreground">Avg Hold</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-bold">{formatPnL(calculateStats.maxDrawdown, false)}</div>
              <div className="text-xs text-muted-foreground">Max DD</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-bold">{formatPnL(calculateStats.currentDrawdown, false)}</div>
              <div className="text-xs text-muted-foreground">Current DD</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-bold text-blue-500">{openTrades.length}</div>
              <div className="text-xs text-muted-foreground">Open Trades</div>
            </div>
          </div>

          {/* Open Trade Button */}
          {currentSignal && currentSignal.type !== 'NEUTRAL' && selectedMarketData && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">New Signal Available</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentSignal.type} {selectedPair} @ ${selectedMarketData.price.toFixed(selectedMarketData.price > 1 ? 2 : 6)}
                    </p>
                  </div>
                  <Badge className="bg-blue-500">
                    {(currentSignal.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="text-center">
                    <div className="text-muted-foreground">Leverage</div>
                    <div className="font-bold text-orange-500">{currentSignal.leverage || 1}x</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Position Size</div>
                    <div className="font-bold">{currentSignal.positionSize.toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Margin Required</div>
                    <div className="font-bold">${formatCurrency(balance * currentSignal.positionSize / 100)}</div>
                  </div>
                </div>

                <Button
                  onClick={handleOpenTrade}
                  className="w-full"
                  size="lg"
                  disabled={calculateStats.availableMargin < (balance * currentSignal.positionSize / 100)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Open Paper Trade
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Live Open Trades (Binance-style) */}
      {openTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Open Positions ({openTrades.length})
              <div className="flex items-center gap-1 ml-2">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Live Updates</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {openTrades.map((trade) => {
                const currentPrice = marketData.find(m => m.symbol === trade.pair)?.price || trade.entryPrice;
                const riskData = getRiskLevel(trade.marginRatio || 1);

                return (
                  <Card key={trade.id} className="p-4 border-2 border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {trade.positionType === 'LONG' ? (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={trade.positionType === 'LONG' ? 'default' : 'destructive'}>
                              {trade.positionType} {trade.pair}
                            </Badge>
                            <Badge variant="outline" className="text-orange-500">
                              <Zap className="w-3 h-3 mr-1" />
                              {trade.leverage}x
                            </Badge>
                            <Badge variant="outline" className={riskData.color}>
                              <Shield className="w-3 h-3 mr-1" />
                              {riskData.level}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {Math.floor((Date.now() - trade.entryTime) / (1000 * 60))}m ago
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCloseTrade(trade.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                        Close
                      </Button>
                    </div>
                    
                    {/* Live P&L Display (Binance-style) */}
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Unrealized P&L</span>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatPnL(trade.unrealizedPnL)}
                          </div>
                          <div className="text-sm">
                            {formatPercentage(trade.unrealizedPnLPercentage)} ROI
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Mark Price: ${currentPrice.toFixed(6)}</span>
                        <span>Margin Ratio: {((trade.marginRatio || 1) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    {/* Position Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="text-center">
                        <div className="text-muted-foreground">Entry</div>
                        <div className="font-medium">${trade.entryPrice.toFixed(6)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Size</div>
                        <div className="font-medium">${formatCurrency(trade.positionSizeUSD)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Margin</div>
                        <div className="font-medium">${formatCurrency(trade.marginUsed)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Liq. Price</div>
                        <div className="font-medium text-red-400">${(trade.liquidationPrice || 0).toFixed(6)}</div>
                      </div>
                    </div>

                    {/* SL/TP Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>SL: ${trade.stopLoss.toFixed(6)}</span>
                        <span>Current: ${currentPrice.toFixed(6)}</span>
                        <span>TP: ${trade.takeProfit.toFixed(6)}</span>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                          style={{ width: '100%' }}
                        />
                        <div 
                          className="absolute w-1 h-4 bg-white border-2 border-blue-500 rounded-full -top-1 transform -translate-x-1/2 shadow-lg"
                          style={{
                            left: `${Math.max(0, Math.min(100, 
                              ((currentPrice - trade.stopLoss) / (trade.takeProfit - trade.stopLoss)) * 100
                            ))}%`
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Recent Closed Trades */}
      {closedTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead>Entry/Exit</TableHead>
                  <TableHead>Hold Time</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Close Reason</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedTrades.slice(-10).reverse().map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>
                      <Badge variant={trade.positionType === 'LONG' ? 'default' : 'destructive'}>
                        {trade.positionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-orange-500">
                        {trade.leverage}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>${trade.entryPrice.toFixed(6)}</div>
                      <div className="text-muted-foreground">${trade.exitPrice?.toFixed(6)}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {trade.holdingTimeMinutes ? `${trade.holdingTimeMinutes}m` : '-'}
                    </TableCell>
                    <TableCell>{formatPnL(trade.pnl || 0)}</TableCell>
                    <TableCell>{formatPercentage(trade.roi || trade.pnlPercentage)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        trade.closeReason === 'TP_HIT' ? 'text-green-500' :
                        trade.closeReason === 'SL_HIT' ? 'text-red-500' : 'text-blue-500'
                      }>
                        {trade.closeReason === 'TP_HIT' ? 'TP' : 
                         trade.closeReason === 'SL_HIT' ? 'SL' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.outcome === 'WIN' ? 'default' : 'destructive'}>
                        {trade.outcome}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
