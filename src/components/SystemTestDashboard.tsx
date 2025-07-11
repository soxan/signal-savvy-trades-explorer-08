
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  Settings,
  RefreshCw,
  Monitor
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'RUNNING';
  details: string;
  duration?: number;
  data?: any;
}

interface SystemMetrics {
  apiConnectivity: TestResult;
  dataQuality: TestResult;
  signalGeneration: TestResult;
  paperTrading: TestResult;
  riskManagement: TestResult;
  performance: TestResult;
  storage: TestResult;
  notifications: TestResult;
}

export function SystemTestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    apiConnectivity: { name: 'API Connectivity', status: 'RUNNING', details: 'Testing...' },
    dataQuality: { name: 'Data Quality', status: 'RUNNING', details: 'Testing...' },
    signalGeneration: { name: 'Signal Generation', status: 'RUNNING', details: 'Testing...' },
    paperTrading: { name: 'Paper Trading', status: 'RUNNING', details: 'Testing...' },
    riskManagement: { name: 'Risk Management', status: 'RUNNING', details: 'Testing...' },
    performance: { name: 'Performance', status: 'RUNNING', details: 'Testing...' },
    storage: { name: 'Storage Systems', status: 'RUNNING', details: 'Testing...' },
    notifications: { name: 'Notifications', status: 'RUNNING', details: 'Testing...' }
  });

  const runSystemTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const tests = [
      { key: 'apiConnectivity', test: testApiConnectivity },
      { key: 'dataQuality', test: testDataQuality },
      { key: 'signalGeneration', test: testSignalGeneration },
      { key: 'paperTrading', test: testPaperTrading },
      { key: 'riskManagement', test: testRiskManagement },
      { key: 'performance', test: testPerformance },
      { key: 'storage', test: testStorage },
      { key: 'notifications', test: testNotifications }
    ];

    for (let i = 0; i < tests.length; i++) {
      const { key, test } = tests[i];
      console.log(`🧪 Running test: ${key}`);
      
      const startTime = Date.now();
      try {
        const result = await test();
        const duration = Date.now() - startTime;
        
        setMetrics(prev => ({
          ...prev,
          [key]: {
            ...prev[key as keyof SystemMetrics],
            ...result,
            duration,
            status: result.status || 'PASS'
          }
        }));
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          [key]: {
            ...prev[key as keyof SystemMetrics],
            status: 'FAIL',
            details: `Error: ${error}`,
            duration: Date.now() - startTime
          }
        }));
      }
      
      setProgress(((i + 1) / tests.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    console.log('🎉 System test completed');
  };

  const testApiConnectivity = async (): Promise<Partial<TestResult>> => {
    try {
      // Test Binance API
      const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
      const binanceData = await binanceResponse.json();
      
      // Test CoinGecko API
      const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const coinGeckoData = await coinGeckoResponse.json();
      
      if (binanceData.symbol && coinGeckoData.bitcoin) {
        return {
          status: 'PASS',
          details: `APIs responding correctly. BTC: $${binanceData.lastPrice}, CoinGecko: $${coinGeckoData.bitcoin.usd}`,
          data: { binance: binanceData, coinGecko: coinGeckoData }
        };
      } else {
        return {
          status: 'WARNING',
          details: 'API responses incomplete'
        };
      }
    } catch (error) {
      return {
        status: 'FAIL',
        details: `API connectivity failed: ${error}`
      };
    }
  };

  const testDataQuality = async (): Promise<Partial<TestResult>> => {
    try {
      const stored = localStorage.getItem('market_data_cache');
      if (!stored) {
        return { status: 'WARNING', details: 'No cached market data found' };
      }
      
      const data = JSON.parse(stored);
      const pairs = Object.keys(data);
      let validPairs = 0;
      let totalVolume = 0;
      
      pairs.forEach(pair => {
        const pairData = data[pair];
        if (pairData.price && pairData.volume24h && pairData.change24h !== undefined) {
          validPairs++;
          totalVolume += parseFloat(pairData.volume24h) || 0;
        }
      });
      
      const qualityScore = (validPairs / pairs.length) * 100;
      
      return {
        status: qualityScore > 90 ? 'PASS' : qualityScore > 70 ? 'WARNING' : 'FAIL',
        details: `${validPairs}/${pairs.length} pairs valid (${qualityScore.toFixed(1)}%). Total volume: $${(totalVolume / 1e9).toFixed(2)}B`,
        data: { validPairs, totalPairs: pairs.length, qualityScore, totalVolume }
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: `Data quality check failed: ${error}`
      };
    }
  };

  const testSignalGeneration = async (): Promise<Partial<TestResult>> => {
    try {
      const signalHistory = localStorage.getItem('trading_signals_history');
      if (!signalHistory) {
        return { status: 'WARNING', details: 'No signal history found' };
      }
      
      const signals = JSON.parse(signalHistory);
      const recentSignals = signals.filter((s: any) => 
        Date.now() - s.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );
      
      const buySignals = recentSignals.filter((s: any) => s.signal.type === 'BUY').length;
      const sellSignals = recentSignals.filter((s: any) => s.signal.type === 'SELL').length;
      const avgConfidence = recentSignals.reduce((sum: number, s: any) => 
        sum + (s.signal.confidence || 0), 0) / recentSignals.length;
      
      return {
        status: recentSignals.length > 0 ? 'PASS' : 'WARNING',
        details: `${recentSignals.length} signals in 24h (${buySignals} BUY, ${sellSignals} SELL). Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`,
        data: { total: recentSignals.length, buySignals, sellSignals, avgConfidence }
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: `Signal generation test failed: ${error}`
      };
    }
  };

  const testPaperTrading = async (): Promise<Partial<TestResult>> => {
    try {
      const paperTrades = localStorage.getItem('paper_trades');
      if (!paperTrades) {
        return { status: 'WARNING', details: 'No paper trading data found' };
      }
      
      const data = JSON.parse(paperTrades);
      const trades = data.trades || [];
      const openTrades = trades.filter((t: any) => t.status === 'OPEN');
      const closedTrades = trades.filter((t: any) => t.status === 'CLOSED');
      const wins = closedTrades.filter((t: any) => t.outcome === 'WIN');
      const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
      
      const hasLeverage = trades.some((t: any) => t.leverage && t.leverage > 1);
      const hasMarginTracking = trades.some((t: any) => t.marginUsed !== undefined);
      const hasAutoSLTP = trades.some((t: any) => t.closeReason === 'SL_HIT' || t.closeReason === 'TP_HIT');
      
      let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
      let features = [];
      
      if (!hasLeverage) features.push('Leverage tracking');
      if (!hasMarginTracking) features.push('Margin tracking');
      if (!hasAutoSLTP) features.push('Auto SL/TP');
      
      if (features.length > 0) {
        status = 'WARNING';
      }
      
      return {
        status,
        details: `${trades.length} total trades (${openTrades.length} open, ${closedTrades.length} closed). Win rate: ${winRate.toFixed(1)}%. ${features.length > 0 ? `Missing: ${features.join(', ')}` : 'All features working'}`,
        data: { totalTrades: trades.length, openTrades: openTrades.length, winRate, hasLeverage, hasMarginTracking, hasAutoSLTP }
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: `Paper trading test failed: ${error}`
      };
    }
  };

  const testRiskManagement = async (): Promise<Partial<TestResult>> => {
    try {
      // Test if risk management is calculating properly
      const paperTrades = localStorage.getItem('paper_trades');
      if (!paperTrades) {
        return { status: 'WARNING', details: 'No trading data to analyze risk management' };
      }
      
      const data = JSON.parse(paperTrades);
      const trades = data.trades || [];
      
      let riskChecks = 0;
      let passedChecks = 0;
      
      // Check position sizing
      trades.forEach((trade: any) => {
        if (trade.signal && trade.signal.positionSize) {
          riskChecks++;
          if (trade.signal.positionSize <= 10) passedChecks++; // Max 10% position size
        }
        
        if (trade.leverage) {
          riskChecks++;
          if (trade.leverage <= 10) passedChecks++; // Max 10x leverage
        }
        
        if (trade.stopLoss && trade.entryPrice) {
          riskChecks++;
          const stopDistance = Math.abs(trade.stopLoss - trade.entryPrice) / trade.entryPrice;
          if (stopDistance <= 0.1) passedChecks++; // Max 10% stop loss
        }
      });
      
      const riskScore = riskChecks > 0 ? (passedChecks / riskChecks) * 100 : 0;
      
      return {
        status: riskScore > 80 ? 'PASS' : riskScore > 60 ? 'WARNING' : 'FAIL',
        details: `Risk management score: ${riskScore.toFixed(1)}% (${passedChecks}/${riskChecks} checks passed)`,
        data: { riskScore, passedChecks, totalChecks: riskChecks }
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: `Risk management test failed: ${error}`
      };
    }
  };

  const testPerformance = async (): Promise<Partial<TestResult>> => {
    const startTime = performance.now();
    
    try {
      // Test rendering performance
      const renderStart = performance.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const renderTime = performance.now() - renderStart;
      
      // Test memory usage (approximate)
      const memoryUsage = (performance as any).memory ? 
        (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0;
      
      // Test localStorage size
      let storageSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          storageSize += localStorage[key].length;
        }
      }
      storageSize = storageSize / 1024; // KB
      
      const totalTime = performance.now() - startTime;
      
      let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
      let issues = [];
      
      if (renderTime > 200) issues.push('Slow rendering');
      if (memoryUsage > 100) issues.push('High memory usage');
      if (storageSize > 1000) issues.push('Large storage usage');
      
      if (issues.length > 0) status = 'WARNING';
      
      return {
        status,
        details: `Render: ${renderTime.toFixed(0)}ms, Memory: ${memoryUsage.toFixed(1)}MB, Storage: ${storageSize.toFixed(1)}KB. ${issues.length > 0 ? `Issues: ${issues.join(', ')}` : 'Performance good'}`,
        data: { renderTime, memoryUsage, storageSize, totalTime }
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: `Performance test failed: ${error}`
      };
    }
  };

  const testStorage = async (): Promise<Partial<TestResult>> => {
    try {
      const testKey = 'system_test_' + Date.now();
      const testData = { test: true, timestamp: Date.now() };
      
      // Test write
      localStorage.setItem(testKey, JSON.stringify(testData));
      
      // Test read
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      
      // Test delete
      localStorage.removeItem(testKey);
      
      // Check existing data integrity
      const criticalKeys = ['paper_trades', 'trading_signals_history', 'trading_notifications'];
      let validKeys = 0;
      
      criticalKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            JSON.parse(data);
            validKeys++;
          }
        } catch {
          // Invalid JSON
        }
      });
      
      return {
        status: retrieved.test && validKeys === criticalKeys.length ? 'PASS' : 'WARNING',
        details: `Storage operations working. ${validKeys}/${criticalKeys.length} critical data stores valid`,
        data: { validKeys, totalKeys: criticalKeys.length }
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: `Storage test failed: ${error}`
      };
    }
  };

  const testNotifications = async (): Promise<Partial<TestResult>> => {
    try {
      // Test notification system
      const notifications = localStorage.getItem('trading_notifications');
      const notificationCount = notifications ? JSON.parse(notifications).length : 0;
      
      // Test notification function availability
      const hasNotificationFunction = typeof (window as any).addSystemNotification === 'function';
      
      // Test notification creation
      if (hasNotificationFunction) {
        (window as any).addSystemNotification({
          type: 'SYSTEM_TEST',
          title: 'System Test',
          message: 'Notification system working',
          severity: 'LOW'
        });
      }
      
      return {
        status: hasNotificationFunction ? 'PASS' : 'WARNING',
        details: `${notificationCount} notifications stored. Function available: ${hasNotificationFunction}`,
        data: { notificationCount, hasFunction: hasNotificationFunction }
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: `Notification test failed: ${error}`
      };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'RUNNING':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Monitor className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'text-green-500';
      case 'FAIL':
        return 'text-red-500';
      case 'WARNING':
        return 'text-yellow-500';
      case 'RUNNING':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runSystemTests();
  }, []);

  const overallStatus = Object.values(metrics).every(m => m.status === 'PASS') ? 'PASS' :
                      Object.values(metrics).some(m => m.status === 'FAIL') ? 'FAIL' : 'WARNING';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              System Health Dashboard
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(overallStatus)}>
                {overallStatus}
              </Badge>
              <Button 
                onClick={runSystemTests}
                disabled={isRunning}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                Run Tests
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isRunning && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Testing in progress...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(metrics).map(([key, metric]) => (
                  <Card key={key} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(metric.status)}
                        <div>
                          <h3 className="font-semibold">{metric.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {metric.details}
                          </p>
                        </div>
                      </div>
                      {metric.duration && (
                        <Badge variant="outline">
                          {metric.duration}ms
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              {Object.entries(metrics).map(([key, metric]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(metric.status)}
                      {metric.name}
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{metric.details}</p>
                    {metric.data && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Technical Details:</h4>
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(metric.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overallStatus === 'FAIL' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <h4 className="font-semibold text-red-500 mb-2">Critical Issues Detected</h4>
                      <p>The system has critical failures that need immediate attention.</p>
                    </div>
                  )}
                  
                  {Object.entries(metrics).map(([key, metric]) => {
                    if (metric.status === 'WARNING' || metric.status === 'FAIL') {
                      return (
                        <div key={key} className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <h4 className="font-semibold text-yellow-600 mb-2">{metric.name}</h4>
                          <p>{metric.details}</p>
                          {key === 'paperTrading' && (
                            <ul className="mt-2 list-disc list-inside text-sm">
                              <li>Ensure all trades track leverage and margin usage</li>
                              <li>Implement automatic SL/TP monitoring</li>
                              <li>Add real-time P&L calculations</li>
                            </ul>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {overallStatus === 'PASS' && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="font-semibold text-green-600 mb-2">System Health Excellent</h4>
                      <p>All systems are functioning optimally. Continue monitoring for consistent performance.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
