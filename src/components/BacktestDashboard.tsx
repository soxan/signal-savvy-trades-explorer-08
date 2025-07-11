import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Target, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Calendar,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useBacktestEngine, BacktestConfig, BacktestResults } from '@/hooks/useBacktestEngine';
import { useTradingData } from '@/hooks/useTradingData';

interface BacktestDashboardProps {
  selectedPair: string;
  selectedTimeframe: string;
}

export function BacktestDashboard({ selectedPair, selectedTimeframe }: BacktestDashboardProps) {
  const { runBacktest, isRunning, progress, results, error, clearResults } = useBacktestEngine();
  const { candlestickData } = useTradingData(selectedPair, selectedTimeframe, false);
  
  const [config, setConfig] = useState<BacktestConfig>({
    initialBalance: 10000,
    positionSizing: 'PERCENTAGE',
    positionSizeValue: 2, // 2% per trade
    maxOpenPositions: 3,
    enableLeverage: true,
    maxLeverage: 10,
    stopLossType: 'SIGNAL',
    takeProfitType: 'SIGNAL',
    slippage: 0.1, // 0.1%
    commission: 0.1, // 0.1%
    timeStopHours: 72 // 3 days max holding
  });

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Set default date range (last 6 months)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  const handleRunBacktest = async () => {
    if (!candlestickData || candlestickData.length === 0) {
      console.error('No candlestick data available for backtesting');
      return;
    }

    try {
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : undefined;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : undefined;
      
      await runBacktest(candlestickData, selectedPair, config, startDate, endDate);
    } catch (err) {
      console.error('Backtest failed:', err);
    }
  };

  const exportResults = () => {
    if (!results) return;
    
    const data = {
      config,
      results,
      pair: selectedPair,
      timeframe: selectedTimeframe,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest-${selectedPair}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Strategy Backtest Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive performance evaluation for {selectedPair} on {selectedTimeframe} timeframe
          </p>
        </div>
        
        <div className="flex gap-2">
          {results && (
            <Button variant="outline" onClick={exportResults}>
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          )}
          
          <Button 
            onClick={clearResults} 
            variant="outline"
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
          
          <Button 
            onClick={handleRunBacktest}
            disabled={isRunning || !candlestickData || candlestickData.length === 0}
          >
            {isRunning ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Backtest'}
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Backtest Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Initial Balance</label>
              <input
                type="number"
                value={config.initialBalance}
                onChange={(e) => setConfig(prev => ({ ...prev, initialBalance: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded"
                disabled={isRunning}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Position Size (%)</label>
              <input
                type="number"
                value={config.positionSizeValue}
                onChange={(e) => setConfig(prev => ({ ...prev, positionSizeValue: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded"
                disabled={isRunning}
                min="0.1"
                max="25"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Max Leverage</label>
              <input
                type="number"
                value={config.maxLeverage}
                onChange={(e) => setConfig(prev => ({ ...prev, maxLeverage: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded"
                disabled={isRunning}
                min="1"
                max="100"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Commission (%)</label>
              <input
                type="number"
                value={config.commission}
                onChange={(e) => setConfig(prev => ({ ...prev, commission: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded"
                disabled={isRunning}
                min="0"
                max="1"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded"
                disabled={isRunning}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded"
                disabled={isRunning}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Running backtest...</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Backtest Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trade Analysis</TabsTrigger>
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {/* Key Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${results.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(results.totalReturn)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPercentage(results.totalReturnPercentage)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${results.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {results.winningTrades}/{results.totalTrades} trades
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Max Drawdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {formatPercentage(-results.maxDrawdownPercentage)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(-results.maxDrawdown)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Sharpe Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${results.sharpeRatio >= 1 ? 'text-green-500' : results.sharpeRatio >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {results.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Risk-adjusted return
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Profit Factor:</span>
                    <Badge variant={results.profitFactor >= 1.5 ? 'default' : 'secondary'}>
                      {results.profitFactor.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Calmar Ratio:</span>
                    <span>{results.calmarRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Consecutive Losses:</span>
                    <span className="text-red-500">{results.consecutiveLosses}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trade Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average Win:</span>
                    <span className="text-green-500">{formatCurrency(results.avgWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Loss:</span>
                    <span className="text-red-500">{formatCurrency(-results.avgLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Largest Win:</span>
                    <span className="text-green-500">{formatCurrency(results.largestWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Largest Loss:</span>
                    <span className="text-red-500">{formatCurrency(results.largestLoss)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timing Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Avg Holding Period:</span>
                    <span>{formatDuration(results.avgHoldingPeriod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fees:</span>
                    <span className="text-red-500">{formatCurrency(results.totalFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Consecutive Wins:</span>
                    <span className="text-green-500">{results.consecutiveWins}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.monthlyReturns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Return']} />
                      <Bar dataKey="return">
                        {results.monthlyReturns.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Entry</th>
                        <th className="text-left p-2">Exit</th>
                        <th className="text-left p-2">P&L</th>
                        <th className="text-left p-2">Holding</th>
                        <th className="text-left p-2">Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.trades.slice().reverse().map((trade) => (
                        <tr key={trade.id} className="border-b">
                          <td className="p-2">
                            {new Date(trade.entryTime).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <Badge variant={trade.signal.type === 'BUY' ? 'default' : 'destructive'}>
                              {trade.signal.type}
                            </Badge>
                          </td>
                          <td className="p-2">${trade.entryPrice.toFixed(6)}</td>
                          <td className="p-2">
                            {trade.exitPrice ? `$${trade.exitPrice.toFixed(6)}` : 'Open'}
                          </td>
                          <td className={`p-2 ${(trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                          </td>
                          <td className="p-2">
                            {trade.holdingPeriod ? formatDuration(trade.holdingPeriod) : '-'}
                          </td>
                          <td className="p-2">
                            {trade.outcome && (
                              <Badge variant={trade.outcome === 'WIN' ? 'default' : 'destructive'}>
                                {trade.outcome}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equity">
            <Card>
              <CardHeader>
                <CardTitle>Equity Curve & Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={results.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      type="number" 
                      scale="time" 
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number, name: string) => [
                        name === 'equity' ? formatCurrency(value) : formatPercentage(-value),
                        name === 'equity' ? 'Equity' : 'Drawdown'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
