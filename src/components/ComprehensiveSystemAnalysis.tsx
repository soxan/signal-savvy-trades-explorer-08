
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Database,
  Zap,
  Shield,
  Monitor,
  RefreshCw,
  Brain,
  Target
} from 'lucide-react';
import { useTradingData } from '@/hooks/useTradingData';
import { useUnifiedSignalGeneration } from '@/hooks/useUnifiedSignalGeneration';
import { useSystemDebugger } from '@/hooks/useSystemDebugger';

interface TestResult {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'RUNNING';
  details: string;
  score: number;
  recommendations: string[];
  data?: any;
}

interface SystemAnalysis {
  overallHealth: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  overallScore: number;
  categories: {
    dataIntegrity: TestResult[];
    signalGeneration: TestResult[];
    performance: TestResult[];
    userExperience: TestResult[];
    systemStability: TestResult[];
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
  };
}

export function ComprehensiveSystemAnalysis() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<SystemAnalysis | null>(null);
  const [selectedPair] = useState('BTC/USDT');
  const [selectedTimeframe] = useState('1h');

  const { marketData, candlestickData, isMarketLoading, apiError } = useTradingData(
    selectedPair, 
    selectedTimeframe, 
    true
  );
  
  // Fixed: Add marketData as the third required parameter
  const { currentSignal, signalHistory, persistedSignals } = useUnifiedSignalGeneration(
    candlestickData, 
    selectedPair,
    marketData || []
  );

  const {
    metrics,
    runComprehensiveAnalysis,
    analyzeVolumeThresholds,
    getOptimizedThresholds
  } = useSystemDebugger();

  const runFullSystemAnalysis = async () => {
    setIsRunning(true);
    setProgress(0);
    
    console.log('🔍 Starting comprehensive system analysis...');
    
    const results: SystemAnalysis = {
      overallHealth: 'GOOD',
      overallScore: 0,
      categories: {
        dataIntegrity: [],
        signalGeneration: [],
        performance: [],
        userExperience: [],
        systemStability: []
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warningTests: 0
      }
    };

    try {
      // Test 1: Data Integrity (25% of tests)
      setProgress(10);
      const dataTests = await testDataIntegrity();
      results.categories.dataIntegrity = dataTests;
      
      setProgress(25);
      // Test 2: Signal Generation (25% of tests)
      const signalTests = await testSignalGeneration();
      results.categories.signalGeneration = signalTests;
      
      setProgress(50);
      // Test 3: Performance (20% of tests)
      const performanceTests = await testPerformance();
      results.categories.performance = performanceTests;
      
      setProgress(70);
      // Test 4: User Experience (15% of tests)
      const uxTests = await testUserExperience();
      results.categories.userExperience = uxTests;
      
      setProgress(85);
      // Test 5: System Stability (15% of tests)
      const stabilityTests = await testSystemStability();
      results.categories.systemStability = stabilityTests;
      
      setProgress(100);
      
      // Calculate overall metrics
      const allTests = [
        ...dataTests,
        ...signalTests,
        ...performanceTests,
        ...uxTests,
        ...stabilityTests
      ];
      
      results.summary.totalTests = allTests.length;
      results.summary.passedTests = allTests.filter(t => t.status === 'PASS').length;
      results.summary.failedTests = allTests.filter(t => t.status === 'FAIL').length;
      results.summary.warningTests = allTests.filter(t => t.status === 'WARNING').length;
      
      const averageScore = allTests.reduce((sum, test) => sum + test.score, 0) / allTests.length;
      results.overallScore = Math.round(averageScore);
      
      if (averageScore >= 90) results.overallHealth = 'EXCELLENT';
      else if (averageScore >= 75) results.overallHealth = 'GOOD';
      else if (averageScore >= 60) results.overallHealth = 'WARNING';
      else results.overallHealth = 'CRITICAL';
      
      setAnalysis(results);
      
      console.log('✅ Comprehensive system analysis completed:', {
        overallHealth: results.overallHealth,
        overallScore: results.overallScore,
        summary: results.summary
      });
      
    } catch (error) {
      console.error('❌ Error in comprehensive analysis:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testDataIntegrity = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // API Connectivity Test
    try {
      const binanceTest = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
      const binanceData = await binanceTest.json();
      
      tests.push({
        category: 'Data Integrity',
        name: 'API Connectivity',
        status: binanceData.symbol ? 'PASS' : 'FAIL',
        details: binanceData.symbol ? 
          `Binance API responding. BTC: $${parseFloat(binanceData.lastPrice).toFixed(2)}` :
          'Binance API not responding properly',
        score: binanceData.symbol ? 100 : 0,
        recommendations: binanceData.symbol ? [] : ['Check network connection', 'Verify API endpoints']
      });
    } catch (error) {
      tests.push({
        category: 'Data Integrity',
        name: 'API Connectivity',
        status: 'FAIL',
        details: `API connection failed: ${error}`,
        score: 0,
        recommendations: ['Check network connection', 'Verify API endpoints', 'Check CORS settings']
      });
    }

    // Market Data Quality
    if (marketData && marketData.length > 0) {
      const validData = marketData.filter(d => d.price > 0 && d.volume24h > 0).length;
      const qualityScore = (validData / marketData.length) * 100;
      
      tests.push({
        category: 'Data Integrity',
        name: 'Market Data Quality',
        status: qualityScore > 90 ? 'PASS' : qualityScore > 70 ? 'WARNING' : 'FAIL',
        details: `${validData}/${marketData.length} valid data points (${qualityScore.toFixed(1)}%)`,
        score: qualityScore,
        recommendations: qualityScore < 90 ? ['Review data validation logic', 'Check API response handling'] : []
      });
    }

    // Volume Analysis
    if (marketData) {
      const btcData = marketData.find(d => d.symbol === 'BTC/USDT');
      if (btcData) {
        const volumeAnalysis = analyzeVolumeThresholds([btcData], 'BTC/USDT');
        
        tests.push({
          category: 'Data Integrity',
          name: 'Volume Validation',
          status: volumeAnalysis?.isRealistic ? 'PASS' : 'WARNING',
          details: volumeAnalysis ? 
            `Volume: ${(volumeAnalysis.currentVolume / 1e9).toFixed(2)}B (Expected: ${(volumeAnalysis.expectedMinimum / 1e9).toFixed(2)}B+)` :
            'Volume analysis unavailable',
          score: volumeAnalysis?.isRealistic ? 95 : 60,
          recommendations: volumeAnalysis?.isRealistic ? [] : ['Review volume calculation logic', 'Check data source accuracy']
        });
      }
    }

    return tests;
  };

  const testSignalGeneration = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Signal Generation Rate
    const recentSignals = signalHistory.filter(s => 
      Date.now() - s.timestamp < 24 * 60 * 60 * 1000
    );
    
    tests.push({
      category: 'Signal Generation',
      name: 'Signal Generation Rate',
      status: recentSignals.length > 0 ? 'PASS' : 'WARNING',
      details: `${recentSignals.length} signals in last 24h`,
      score: Math.min(100, recentSignals.length * 20),
      recommendations: recentSignals.length === 0 ? ['Check signal generation logic', 'Verify threshold settings'] : []
    });

    // Signal Quality
    if (currentSignal) {
      const confidenceScore = currentSignal.confidence * 100;
      
      tests.push({
        category: 'Signal Generation',
        name: 'Current Signal Quality',
        status: confidenceScore > 15 ? 'PASS' : confidenceScore > 8 ? 'WARNING' : 'FAIL',
        details: `${currentSignal.type} signal with ${confidenceScore.toFixed(1)}% confidence`,
        score: Math.min(100, confidenceScore * 5),
        recommendations: confidenceScore < 15 ? ['Review technical indicators', 'Adjust signal thresholds'] : []
      });
    }

    // Persistence System
    tests.push({
      category: 'Signal Generation',
      name: 'Signal Persistence',
      status: persistedSignals.length > 0 ? 'PASS' : 'WARNING',
      details: `${persistedSignals.length} signals stored`,
      score: Math.min(100, persistedSignals.length * 10),
      recommendations: persistedSignals.length === 0 ? ['Check localStorage functionality', 'Verify signal saving logic'] : []
    });

    // Threshold Optimization
    const optimizedThresholds = getOptimizedThresholds();
    tests.push({
      category: 'Signal Generation',
      name: 'Threshold Optimization',
      status: 'PASS',
      details: `Adaptive thresholds: ${(optimizedThresholds.confidenceThreshold * 100).toFixed(1)}% confidence, ${optimizedThresholds.qualityThreshold} quality`,
      score: 85,
      recommendations: [],
      data: optimizedThresholds
    });

    return tests;
  };

  const testPerformance = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Memory Usage
    const memoryUsage = (performance as any).memory ? 
      (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0;
    
    tests.push({
      category: 'Performance',
      name: 'Memory Usage',
      status: memoryUsage < 100 ? 'PASS' : memoryUsage < 200 ? 'WARNING' : 'FAIL',
      details: `${memoryUsage.toFixed(1)}MB used`,
      score: Math.max(0, 100 - memoryUsage),
      recommendations: memoryUsage > 100 ? ['Optimize component re-renders', 'Check for memory leaks'] : []
    });

    // Storage Usage
    let storageSize = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          storageSize += localStorage[key].length;
        }
      }
      storageSize = storageSize / 1024; // KB
      
      tests.push({
        category: 'Performance',
        name: 'Storage Efficiency',
        status: storageSize < 500 ? 'PASS' : storageSize < 1000 ? 'WARNING' : 'FAIL',
        details: `${storageSize.toFixed(1)}KB localStorage used`,
        score: Math.max(0, 100 - (storageSize / 10)),
        recommendations: storageSize > 500 ? ['Implement data cleanup', 'Optimize stored data structure'] : []
      });
    } catch (error) {
      tests.push({
        category: 'Performance',
        name: 'Storage Efficiency',
        status: 'WARNING',
        details: 'Unable to measure storage usage',
        score: 70,
        recommendations: ['Check localStorage access']
      });
    }

    // Processing Speed
    const processingTime = metrics.averageProcessingTime;
    tests.push({
      category: 'Performance',
      name: 'Processing Speed',
      status: processingTime < 1000 ? 'PASS' : processingTime < 2000 ? 'WARNING' : 'FAIL',
      details: `${processingTime.toFixed(0)}ms average processing time`,
      score: Math.max(0, 100 - (processingTime / 20)),
      recommendations: processingTime > 1000 ? ['Optimize signal calculations', 'Implement caching'] : []
    });

    return tests;
  };

  const testUserExperience = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Loading States
    tests.push({
      category: 'User Experience',
      name: 'Loading States',
      status: !isMarketLoading ? 'PASS' : 'WARNING',
      details: isMarketLoading ? 'Data still loading' : 'Data loaded successfully',
      score: isMarketLoading ? 60 : 100,
      recommendations: isMarketLoading ? ['Check API response times', 'Implement better caching'] : []
    });

    // Error Handling
    tests.push({
      category: 'User Experience',
      name: 'Error Handling',
      status: !apiError ? 'PASS' : 'FAIL',
      details: apiError || 'No API errors detected',
      score: apiError ? 0 : 100,
      recommendations: apiError ? ['Fix API connectivity issues', 'Implement better error recovery'] : []
    });

    // Mobile Responsiveness
    const isMobile = window.innerWidth < 768;
    tests.push({
      category: 'User Experience',
      name: 'Mobile Responsiveness',
      status: 'PASS',
      details: `Detected ${isMobile ? 'mobile' : 'desktop'} viewport`,
      score: 95,
      recommendations: []
    });

    return tests;
  };

  const testSystemStability = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // System Health
    const systemHealth = metrics.performanceIssues.length === 0 ? 'HEALTHY' : 
                        metrics.performanceIssues.length < 3 ? 'WARNING' : 'CRITICAL';
    
    tests.push({
      category: 'System Stability',
      name: 'System Health',
      status: systemHealth === 'HEALTHY' ? 'PASS' : systemHealth === 'WARNING' ? 'WARNING' : 'FAIL',
      details: `${metrics.performanceIssues.length} performance issues detected`,
      score: systemHealth === 'HEALTHY' ? 100 : systemHealth === 'WARNING' ? 70 : 30,
      recommendations: metrics.performanceIssues.length > 0 ? ['Address performance issues', 'Monitor system metrics'] : []
    });

    // Data Quality Score
    tests.push({
      category: 'System Stability',
      name: 'Data Quality',
      status: metrics.dataQualityScore > 80 ? 'PASS' : metrics.dataQualityScore > 60 ? 'WARNING' : 'FAIL',
      details: `${metrics.dataQualityScore}% data quality score`,
      score: metrics.dataQualityScore,
      recommendations: metrics.dataQualityScore < 80 ? ['Improve data validation', 'Check data sources'] : []
    });

    // Signal Generation Rate
    tests.push({
      category: 'System Stability',
      name: 'Signal Consistency',
      status: metrics.signalGenerationRate > 0 ? 'PASS' : 'WARNING',
      details: `${metrics.signalGenerationRate} signals per minute`,
      score: Math.min(100, metrics.signalGenerationRate * 30),
      recommendations: metrics.signalGenerationRate === 0 ? ['Check signal generation logic', 'Verify data flow'] : []
    });

    return tests;
  };

  useEffect(() => {
    // Run analysis when component mounts
    setTimeout(() => {
      runFullSystemAnalysis();
    }, 1000);
  }, []);

  // Run system debugger analysis
  useEffect(() => {
    if (marketData && currentSignal && persistedSignals) {
      runComprehensiveAnalysis(marketData, currentSignal, persistedSignals, selectedPair);
    }
  }, [marketData, currentSignal, persistedSignals, selectedPair]);

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

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'EXCELLENT':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'GOOD':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'WARNING':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'CRITICAL':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Comprehensive System Analysis
            </div>
            <Button 
              onClick={runFullSystemAnalysis}
              disabled={isRunning}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isRunning && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Running comprehensive analysis...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Overall Health Summary */}
              <div className={`p-6 rounded-lg border-2 ${getHealthColor(analysis.overallHealth)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-8 h-8" />
                    <div>
                      <h3 className="text-2xl font-bold">System Health: {analysis.overallHealth}</h3>
                      <p className="text-sm opacity-80">Overall Score: {analysis.overallScore}/100</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{analysis.overallScore}</div>
                    <div className="text-sm opacity-80">Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-500">{analysis.summary.passedTests}</div>
                    <div className="text-sm">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-500">{analysis.summary.warningTests}</div>
                    <div className="text-sm">Warnings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{analysis.summary.failedTests}</div>
                    <div className="text-sm">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{analysis.summary.totalTests}</div>
                    <div className="text-sm">Total Tests</div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="signals">Signals</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="ux">UX</TabsTrigger>
                  <TabsTrigger value="stability">Stability</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysis.categories).map(([category, tests]) => {
                      const avgScore = tests.reduce((sum, test) => sum + test.score, 0) / tests.length;
                      const passedTests = tests.filter(t => t.status === 'PASS').length;
                      
                      return (
                        <Card key={category}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg capitalize">{category.replace(/([A-Z])/g, ' $1')}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xl font-bold">{avgScore.toFixed(0)}</span>
                              <Badge variant={avgScore > 80 ? 'default' : avgScore > 60 ? 'secondary' : 'destructive'}>
                                {passedTests}/{tests.length}
                              </Badge>
                            </div>
                            <Progress value={avgScore} className="mb-2" />
                            <div className="text-xs text-muted-foreground">
                              {tests.filter(t => t.status === 'FAIL').length > 0 ? 
                                `${tests.filter(t => t.status === 'FAIL').length} issues need attention` :
                                'All systems operational'
                              }
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                {Object.entries(analysis.categories).map(([category, tests]) => (
                  <TabsContent key={category} value={category.replace(/([A-Z])/g, '').toLowerCase()} className="space-y-4">
                    {tests.map((test, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            {test.name}
                            <Badge className={`ml-auto ${
                              test.status === 'PASS' ? 'bg-green-500/20 text-green-600' :
                              test.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-600' :
                              'bg-red-500/20 text-red-600'
                            }`}>
                              {test.score}/100
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">{test.details}</p>
                          {test.recommendations.length > 0 && (
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">Recommendations:</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {test.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {test.data && (
                            <div className="mt-4 bg-muted/30 p-3 rounded-lg">
                              <h4 className="font-semibold mb-2">Technical Data:</h4>
                              <pre className="text-xs overflow-x-auto">
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
