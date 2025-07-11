import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  Settings,
  RefreshCw,
  Target,
  Brain,
  Shield
} from 'lucide-react';
import { useTradingData } from '@/hooks/useTradingData';
import { useUnifiedSignalGeneration } from '@/hooks/useUnifiedSignalGeneration';
import { useHighLeverageTrading } from '@/hooks/useHighLeverageTrading';
import { useSignalPersistence } from '@/hooks/useSignalPersistence';

interface FeatureTest {
  name: string;
  category: 'DATA' | 'SIGNALS' | 'ML' | 'STORAGE' | 'UI';
  status: 'PASS' | 'FAIL' | 'WARNING' | 'TESTING';
  score: number;
  details: string;
  recommendations: string[];
  data?: any;
}

export function FeatureTestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tests, setTests] = useState<FeatureTest[]>([]);
  const [selectedPair] = useState('BTC/USDT');
  const [selectedTimeframe] = useState('1h');

  // Hook up all the system components for testing
  const { marketData, candlestickData, isMarketLoading, apiError } = useTradingData(
    selectedPair, 
    selectedTimeframe, 
    true
  );
  
  // Fixed: Add marketData as the third required parameter
  const { currentSignal, persistedSignals, signalHistory } = useUnifiedSignalGeneration(
    candlestickData, 
    selectedPair,
    marketData || []
  );

  const { 
    analysis: highLeverageAnalysis, 
    hasSignal: hasHighLeverageSignal,
    marketSuitability,
    quickProfitPotential 
  } = useHighLeverageTrading(candlestickData, selectedPair);

  const { persistedSignals: storedSignals } = useSignalPersistence();

  const runFeatureTests = async () => {
    setIsRunning(true);
    setProgress(0);
    const testResults: FeatureTest[] = [];

    console.log('🧪 Starting comprehensive feature tests...');

    // Test 1: Market Data Quality (20%)
    setProgress(10);
    testResults.push(await testMarketDataQuality());
    setProgress(20);

    // Test 2: Signal Generation (25%)
    testResults.push(await testSignalGeneration());
    setProgress(40);

    // Test 3: High-Leverage ML System (25%)
    testResults.push(await testHighLeverageML());
    setProgress(60);

    // Test 4: Data Persistence (15%)
    testResults.push(await testDataPersistence());
    setProgress(80);

    // Test 5: UI Responsiveness (15%)
    testResults.push(await testUIComponents());
    setProgress(100);

    setTests(testResults);
    setIsRunning(false);
    
    console.log('✅ Feature tests completed:', testResults);
  };

  const testMarketDataQuality = async (): Promise<FeatureTest> => {
    console.log('🔍 Testing market data quality...');
    
    if (!marketData || marketData.length === 0) {
      return {
        name: 'Market Data Quality',
        category: 'DATA',
        status: 'FAIL',
        score: 0,
        details: 'No market data available',
        recommendations: ['Check API connectivity', 'Verify data sources']
      };
    }

    const btcData = marketData.find(d => d.symbol === 'BTC/USDT');
    const validDataPoints = marketData.filter(d => 
      d.price > 0 && 
      d.volume24h > 0 && 
      d.changePercent24h !== undefined
    ).length;

    const qualityScore = (validDataPoints / marketData.length) * 100;
    const hasCandlestickData = candlestickData && candlestickData.length > 0;
    const candlestickQuality = hasCandlestickData ? 
      (candlestickData!.filter(c => c.close > 0 && c.volume > 0).length / candlestickData!.length) * 100 : 0;

    const overallScore = (qualityScore * 0.6) + (candlestickQuality * 0.4);

    return {
      name: 'Market Data Quality',
      category: 'DATA',
      status: overallScore > 90 ? 'PASS' : overallScore > 70 ? 'WARNING' : 'FAIL',
      score: Math.round(overallScore),
      details: `${validDataPoints}/${marketData.length} valid market data points (${qualityScore.toFixed(1)}%). Candlestick quality: ${candlestickQuality.toFixed(1)}%`,
      recommendations: overallScore < 90 ? ['Improve data validation', 'Check API reliability'] : [],
      data: { 
        validDataPoints, 
        totalDataPoints: marketData.length, 
        candlestickLength: candlestickData?.length || 0,
        btcPrice: btcData?.price 
      }
    };
  };

  const testSignalGeneration = async (): Promise<FeatureTest> => {
    console.log('🔍 Testing signal generation system...');

    if (!currentSignal) {
      return {
        name: 'Signal Generation',
        category: 'SIGNALS',
        status: 'WARNING',
        score: 30,
        details: 'No current signal generated',
        recommendations: ['Check signal generation logic', 'Verify threshold settings']
      };
    }

    const signalQuality = currentSignal.confidence * 100;
    const hasValidLevels = currentSignal.entry > 0 && currentSignal.stopLoss > 0 && currentSignal.takeProfit > 0;
    const recentSignals = signalHistory.filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000);
    const historicalScore = Math.min(100, recentSignals.length * 10);

    const overallScore = (signalQuality * 0.4) + (hasValidLevels ? 30 : 0) + (historicalScore * 0.3);

    return {
      name: 'Signal Generation',
      category: 'SIGNALS',
      status: overallScore > 70 ? 'PASS' : overallScore > 40 ? 'WARNING' : 'FAIL',
      score: Math.round(overallScore),
      details: `Current signal: ${currentSignal.type} with ${signalQuality.toFixed(1)}% confidence. ${recentSignals.length} signals in 24h`,
      recommendations: overallScore < 70 ? ['Optimize signal thresholds', 'Improve pattern detection'] : [],
      data: {
        currentSignalType: currentSignal.type,
        confidence: signalQuality,
        hasValidLevels,
        recentSignalsCount: recentSignals.length,
        totalHistoryCount: signalHistory.length
      }
    };
  };

  const testHighLeverageML = async (): Promise<FeatureTest> => {
    console.log('🔍 Testing high-leverage ML system...');

    if (!highLeverageAnalysis) {
      return {
        name: 'High-Leverage ML',
        category: 'ML',
        status: 'WARNING',
        score: 20,
        details: 'High-leverage analysis not available',
        recommendations: ['Check ML system initialization', 'Verify data requirements']
      };
    }

    const hasSignal = hasHighLeverageSignal;
    const marketSuitabilityScore = {
      'EXCELLENT': 100,
      'GOOD': 80,
      'POOR': 40,
      'AVOID': 0
    }[marketSuitability] || 0;

    const profitPotentialScore = quickProfitPotential > 0.01 ? 80 : quickProfitPotential > 0.005 ? 60 : 20;
    const overallScore = (marketSuitabilityScore * 0.4) + (profitPotentialScore * 0.3) + (hasSignal ? 30 : 0);

    return {
      name: 'High-Leverage ML',
      category: 'ML',
      status: overallScore > 80 ? 'PASS' : overallScore > 50 ? 'WARNING' : 'FAIL',
      score: Math.round(overallScore),
      details: `Market suitability: ${marketSuitability}. Quick profit potential: ${(quickProfitPotential * 100).toFixed(2)}%. ${hasSignal ? 'Signal detected' : 'No signal'}`,
      recommendations: overallScore < 80 ? ['Optimize ML thresholds', 'Improve pattern-ML integration'] : [],
      data: {
        hasSignal,
        marketSuitability,
        quickProfitPotential,
        liquidationRisk: highLeverageAnalysis.liquidationRisk,
        confidence: highLeverageAnalysis.confidence
      }
    };
  };

  const testDataPersistence = async (): Promise<FeatureTest> => {
    console.log('🔍 Testing data persistence...');

    const storedCount = storedSignals.length;
    const persistedCount = persistedSignals.length;
    
    // Test localStorage functionality
    const testKey = 'feature_test_' + Date.now();
    try {
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const storageWorks = retrieved === 'test';
      const hasSignalHistory = storedCount > 0;
      const hasRecentData = persistedSignals.some(s => Date.now() - s.timestamp < 60 * 60 * 1000);

      const overallScore = (storageWorks ? 40 : 0) + (hasSignalHistory ? 30 : 0) + (hasRecentData ? 30 : 0);

      return {
        name: 'Data Persistence',
        category: 'STORAGE',
        status: overallScore > 80 ? 'PASS' : overallScore > 50 ? 'WARNING' : 'FAIL',
        score: Math.round(overallScore),
        details: `${storedCount} stored signals, ${persistedCount} persisted. Storage: ${storageWorks ? 'Working' : 'Failed'}`,
        recommendations: overallScore < 80 ? ['Check localStorage quota', 'Implement data cleanup'] : [],
        data: { storedCount, persistedCount, storageWorks, hasRecentData }
      };
    } catch (error) {
      return {
        name: 'Data Persistence',
        category: 'STORAGE',
        status: 'FAIL',
        score: 0,
        details: `Storage test failed: ${error}`,
        recommendations: ['Check browser storage settings', 'Implement fallback storage']
      };
    }
  };

  const testUIComponents = async (): Promise<FeatureTest> => {
    console.log('🔍 Testing UI components...');

    const isLoading = isMarketLoading;
    const hasError = !!apiError;
    const dataLoaded = !!marketData && !!candlestickData;
    const responsive = window.innerWidth > 0; // Basic responsiveness check

    const loadingScore = isLoading ? 60 : 90; // Some loading is expected
    const errorScore = hasError ? 0 : 100;
    const dataScore = dataLoaded ? 100 : 0;
    const responsiveScore = responsive ? 100 : 0;

    const overallScore = (loadingScore * 0.2) + (errorScore * 0.3) + (dataScore * 0.3) + (responsiveScore * 0.2);

    return {
      name: 'UI Components',
      category: 'UI',
      status: overallScore > 80 ? 'PASS' : overallScore > 60 ? 'WARNING' : 'FAIL',
      score: Math.round(overallScore),
      details: `Loading: ${isLoading ? 'Yes' : 'No'}, Errors: ${hasError ? 'Yes' : 'No'}, Data: ${dataLoaded ? 'Loaded' : 'Missing'}`,
      recommendations: overallScore < 80 ? ['Optimize loading states', 'Fix API errors', 'Improve error handling'] : [],
      data: { isLoading, hasError, dataLoaded, apiError }
    };
  };

  useEffect(() => {
    // Auto-run tests when data is available
    if (marketData && candlestickData && !isRunning) {
      setTimeout(() => runFeatureTests(), 2000);
    }
  }, [marketData, candlestickData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAIL': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'TESTING': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DATA': return <Database className="w-4 h-4" />;
      case 'SIGNALS': return <TrendingUp className="w-4 h-4" />;
      case 'ML': return <Brain className="w-4 h-4" />;
      case 'STORAGE': return <Shield className="w-4 h-4" />;
      case 'UI': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const overallScore = tests.length > 0 ? Math.round(tests.reduce((sum, test) => sum + test.score, 0) / tests.length) : 0;
  const passedTests = tests.filter(t => t.status === 'PASS').length;
  const failedTests = tests.filter(t => t.status === 'FAIL').length;
  const warningTests = tests.filter(t => t.status === 'WARNING').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              Feature Test Dashboard
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={overallScore > 80 ? 'default' : overallScore > 60 ? 'secondary' : 'destructive'}>
                Overall: {overallScore}/100
              </Badge>
              <Button onClick={runFeatureTests} disabled={isRunning} size="sm">
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
                <span>Running feature tests...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {tests.length > 0 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{passedTests}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-500">{warningTests}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">{failedTests}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold">{tests.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </Card>
              </div>

              {/* Detailed Results */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="DATA">Data</TabsTrigger>
                  <TabsTrigger value="SIGNALS">Signals</TabsTrigger>
                  <TabsTrigger value="ML">ML System</TabsTrigger>
                  <TabsTrigger value="STORAGE">Storage</TabsTrigger>
                  <TabsTrigger value="UI">UI</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {tests.map((test, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(test.status)}
                              {getCategoryIcon(test.category)}
                              <div>
                                <h3 className="font-semibold">{test.name}</h3>
                                <p className="text-sm text-muted-foreground">{test.details}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{test.category}</Badge>
                              <Badge variant={test.score > 80 ? 'default' : test.score > 60 ? 'secondary' : 'destructive'}>
                                {test.score}/100
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {['DATA', 'SIGNALS', 'ML', 'STORAGE', 'UI'].map(category => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    {tests.filter(test => test.category === category).map((test, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            {test.name}
                            <Badge variant={test.score > 80 ? 'default' : test.score > 60 ? 'secondary' : 'destructive'}>
                              {test.score}/100
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">{test.details}</p>
                          
                          {test.recommendations.length > 0 && (
                            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <h4 className="font-semibold text-yellow-600 mb-2">Recommendations:</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {test.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {test.data && (
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">Technical Data:</h4>
                              <pre className="text-sm overflow-x-auto">
                                {JSON.stringify(test.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
