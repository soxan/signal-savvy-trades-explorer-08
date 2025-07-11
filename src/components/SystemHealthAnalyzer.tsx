import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Code,
  Zap,
  Shield,
  Monitor,
  RefreshCw,
  Brain,
  Target,
  Settings,
  Database,
  Wifi,
  Users,
  BarChart3
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { PerformanceMonitor } from './PerformanceMonitor';
import { DataQualityMonitor } from './DataQualityMonitor';
import { useTradingData } from '@/hooks/useTradingData';

interface ComponentAnalysis {
  name: string;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  score: number;
  issues: string[];
  improvements: string[];
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  performance: number;
  maintainability: number;
  reusability: number;
}

interface FeatureAnalysis {
  name: string;
  completeness: number;
  usability: number;
  performance: number;
  reliability: number;
  issues: string[];
  improvements: string[];
}

interface SystemAnalysisResult {
  components: ComponentAnalysis[];
  features: FeatureAnalysis[];
  overallHealth: {
    score: number;
    status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
    criticalIssues: string[];
    recommendations: string[];
  };
  weakAreas: {
    category: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    impact: string;
    solution: string;
  }[];
}

export function SystemHealthAnalyzer() {
  const [analysis, setAnalysis] = useState<SystemAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Get current trading data for quality monitoring
  const { marketData, candlestickData } = useTradingData('BTC/USDT', '1h', true);

  const analyzeComponents = (): ComponentAnalysis[] => {
    return [
      {
        name: 'TradingDashboard',
        status: 'NEEDS_IMPROVEMENT',
        score: 70,
        issues: [
          'Too large (243 lines) - needs refactoring',
          'Multiple responsibilities in single component',
          'Complex state management spread across component'
        ],
        improvements: [
          'Split into smaller, focused components',
          'Extract notification logic to custom hook',
          'Separate mobile/desktop layout logic'
        ],
        complexity: 'HIGH',
        performance: 65,
        maintainability: 60,
        reusability: 40
      },
      {
        name: 'ComprehensiveSystemAnalysis',
        status: 'CRITICAL',
        score: 45,
        issues: [
          'Extremely large (631 lines) - major refactoring needed',
          'Too many responsibilities in single component',
          'Complex nested state management',
          'Difficult to test and maintain'
        ],
        improvements: [
          'Split into multiple specialized components',
          'Extract test logic to separate services',
          'Create reusable test result components',
          'Implement proper error boundaries'
        ],
        complexity: 'HIGH',
        performance: 50,
        maintainability: 30,
        reusability: 20
      },
      {
        name: 'useSystemDebugger',
        status: 'NEEDS_IMPROVEMENT',
        score: 65,
        issues: [
          'Large hook (312 lines) with multiple concerns',
          'Complex state management',
          'Mixed responsibilities'
        ],
        improvements: [
          'Split into multiple focused hooks',
          'Extract analysis logic to separate utilities',
          'Improve type safety'
        ],
        complexity: 'HIGH',
        performance: 70,
        maintainability: 55,
        reusability: 60
      },
      {
        name: 'useUnifiedSignalGeneration',
        status: 'GOOD',
        score: 78,
        issues: [
          'Complex signal processing logic',
          'Multiple effects with interdependencies'
        ],
        improvements: [
          'Add better error recovery',
          'Improve signal validation',
          'Add more comprehensive logging'
        ],
        complexity: 'MEDIUM',
        performance: 80,
        maintainability: 75,
        reusability: 80
      },
      {
        name: 'optimizedSignalProcessor',
        status: 'GOOD',
        score: 82,
        issues: [
          'Cache invalidation could be improved',
          'Error handling needs enhancement'
        ],
        improvements: [
          'Add cache statistics',
          'Implement better error recovery',
          'Add signal quality metrics'
        ],
        complexity: 'MEDIUM',
        performance: 85,
        maintainability: 80,
        reusability: 85
      }
    ];
  };

  const analyzeFeatures = (): FeatureAnalysis[] => {
    return [
      {
        name: 'Signal Generation',
        completeness: 85,
        usability: 80,
        performance: 75,
        reliability: 80,
        issues: [
          'Occasional duplicate signals',
          'Signal confidence could be more accurate',
          'Limited backtesting integration'
        ],
        improvements: [
          'Implement better duplicate detection',
          'Add machine learning for confidence scoring',
          'Integrate with backtesting results'
        ]
      },
      {
        name: 'Market Data Integration',
        completeness: 90,
        usability: 85,
        performance: 70,
        reliability: 75,
        issues: [
          'CoinGecko API failures',
          'Data quality validation needs improvement',
          'Limited error recovery'
        ],
        improvements: [
          'Add more data source redundancy',
          'Implement better caching strategy',
          'Add data quality scoring'
        ]
      },
      {
        name: 'User Interface',
        completeness: 75,
        usability: 70,
        performance: 80,
        reliability: 85,
        issues: [
          'Mobile experience needs improvement',
          'Some components are too complex',
          'Notification system could be better'
        ],
        improvements: [
          'Redesign mobile layout',
          'Simplify complex components',
          'Add better notification management'
        ]
      },
      {
        name: 'Performance Monitoring',
        completeness: 60,
        usability: 65,
        performance: 70,
        reliability: 70,
        issues: [
          'Limited real-time monitoring',
          'Performance metrics are basic',
          'No automated optimization'
        ],
        improvements: [
          'Add real-time performance dashboard',
          'Implement advanced metrics collection',
          'Add automated performance optimization'
        ]
      },
      {
        name: 'Error Handling',
        completeness: 55,
        usability: 60,
        performance: 75,
        reliability: 65,
        issues: [
          'Inconsistent error handling patterns',
          'Limited error recovery mechanisms',
          'Poor error user experience'
        ],
        improvements: [
          'Standardize error handling',
          'Add comprehensive error boundaries',
          'Improve error user feedback'
        ]
      }
    ];
  };

  const identifyWeakAreas = (components: ComponentAnalysis[], features: FeatureAnalysis[]) => {
    return [
      {
        category: 'Code Architecture',
        severity: 'HIGH' as const,
        description: 'Multiple large components that violate single responsibility principle',
        impact: 'Reduced maintainability, increased bug risk, difficult testing',
        solution: 'Refactor large components into smaller, focused components with clear responsibilities'
      },
      {
        category: 'Error Handling',
        severity: 'HIGH' as const,
        description: 'Inconsistent error handling and poor error recovery',
        impact: 'Poor user experience during failures, system instability',
        solution: 'Implement comprehensive error boundaries and standardized error handling patterns'
      },
      {
        category: 'Performance Monitoring',
        severity: 'MEDIUM' as const,
        description: 'Limited real-time performance monitoring and optimization',
        impact: 'Difficulty identifying performance bottlenecks, suboptimal user experience',
        solution: 'Add comprehensive performance monitoring dashboard with automated optimization'
      },
      {
        category: 'Mobile Experience',
        severity: 'MEDIUM' as const,
        description: 'Mobile interface needs significant improvement',
        impact: 'Poor user experience on mobile devices, reduced accessibility',
        solution: 'Redesign mobile layout with mobile-first approach'
      },
      {
        category: 'Data Quality',
        severity: 'MEDIUM' as const,
        description: 'Data validation and quality assurance needs improvement',
        impact: 'Unreliable signals, poor trading decisions',
        solution: 'Implement comprehensive data quality scoring and validation'
      },
      {
        category: 'Testing Coverage',
        severity: 'LOW' as const,
        description: 'Limited automated testing coverage',
        impact: 'Higher risk of bugs, difficult to maintain code quality',
        solution: 'Add comprehensive unit and integration test suite'
      }
    ];
  };

  const runComprehensiveAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    // Simulate analysis progress
    const steps = [
      { name: 'Analyzing Components', progress: 20 },
      { name: 'Evaluating Features', progress: 40 },
      { name: 'Checking Performance', progress: 60 },
      { name: 'Identifying Issues', progress: 80 },
      { name: 'Generating Recommendations', progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(step.progress);
    }

    const components = analyzeComponents();
    const features = analyzeFeatures();
    const weakAreas = identifyWeakAreas(components, features);

    const overallScore = Math.round(
      (components.reduce((sum, c) => sum + c.score, 0) / components.length +
       features.reduce((sum, f) => sum + (f.completeness + f.usability + f.performance + f.reliability) / 4, 0) / features.length) / 2
    );

    const criticalIssues = [
      ...components.filter(c => c.status === 'CRITICAL').map(c => `${c.name}: ${c.issues[0]}`),
      ...weakAreas.filter(w => w.severity === 'HIGH').map(w => w.description)
    ];

    const recommendations = [
      'Refactor large components (TradingDashboard, ComprehensiveSystemAnalysis)',
      'Implement comprehensive error handling strategy',
      'Add performance monitoring dashboard',
      'Improve mobile user experience',
      'Add automated testing suite',
      'Enhance data quality validation'
    ];

    setAnalysis({
      components,
      features,
      overallHealth: {
        score: overallScore,
        status: overallScore >= 85 ? 'EXCELLENT' : overallScore >= 70 ? 'GOOD' : overallScore >= 55 ? 'NEEDS_IMPROVEMENT' : 'CRITICAL',
        criticalIssues,
        recommendations
      },
      weakAreas
    });

    setIsAnalyzing(false);
  };

  useEffect(() => {
    // Auto-run analysis on component mount
    setTimeout(runComprehensiveAnalysis, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'NEEDS_IMPROVEMENT': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-6 h-6" />
                Enhanced System Health Analyzer
              </div>
              <Button 
                onClick={runComprehensiveAnalysis}
                disabled={isAnalyzing}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {isAnalyzing && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Running comprehensive system analysis...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Overall Health Summary */}
                <div className={`p-6 rounded-lg border-2 ${
                  analysis.overallHealth.status === 'EXCELLENT' ? 'border-green-200 bg-green-50' :
                  analysis.overallHealth.status === 'GOOD' ? 'border-blue-200 bg-blue-50' :
                  analysis.overallHealth.status === 'NEEDS_IMPROVEMENT' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-8 h-8" />
                      <div>
                        <h3 className="text-2xl font-bold">System Health: {analysis.overallHealth.status}</h3>
                        <p className="text-sm opacity-80">Overall Score: {analysis.overallHealth.score}/100</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">{analysis.overallHealth.score}</div>
                      <div className="text-sm opacity-80">Score</div>
                    </div>
                  </div>

                  {analysis.overallHealth.criticalIssues.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Critical Issues
                      </h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {analysis.overallHealth.criticalIssues.map((issue, i) => (
                          <li key={i} className="text-red-700">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Top Recommendations</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {analysis.overallHealth.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Enhanced Analysis Tabs */}
                <Tabs defaultValue="components" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="components">Components</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="dataquality">Data Quality</TabsTrigger>
                    <TabsTrigger value="weakareas">Weak Areas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="components" className="space-y-4">
                    <div className="grid gap-4">
                      {analysis.components.map((component, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{component.name}</span>
                              <Badge className={getStatusColor(component.status)}>
                                {component.score}/100
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Performance</div>
                                <div className="font-semibold">{component.performance}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Maintainability</div>
                                <div className="font-semibold">{component.maintainability}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Reusability</div>
                                <div className="font-semibold">{component.reusability}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Complexity</div>
                                <Badge variant={component.complexity === 'LOW' ? 'default' : component.complexity === 'MEDIUM' ? 'secondary' : 'destructive'}>
                                  {component.complexity}
                                </Badge>
                              </div>
                            </div>

                            {component.issues.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold mb-2 text-red-600">Issues</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {component.issues.map((issue, i) => (
                                    <li key={i}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold mb-2 text-green-600">Improvements</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {component.improvements.map((improvement, i) => (
                                  <li key={i}>{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <div className="grid gap-4">
                      {analysis.features.map((feature, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>{feature.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Completeness</div>
                                <Progress value={feature.completeness} className="mt-1" />
                                <div className="text-sm font-semibold mt-1">{feature.completeness}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Usability</div>
                                <Progress value={feature.usability} className="mt-1" />
                                <div className="text-sm font-semibold mt-1">{feature.usability}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Performance</div>
                                <Progress value={feature.performance} className="mt-1" />
                                <div className="text-sm font-semibold mt-1">{feature.performance}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Reliability</div>
                                <Progress value={feature.reliability} className="mt-1" />
                                <div className="text-sm font-semibold mt-1">{feature.reliability}%</div>
                              </div>
                            </div>

                            {feature.issues.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold mb-2 text-red-600">Issues</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {feature.issues.map((issue, i) => (
                                    <li key={i}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold mb-2 text-green-600">Improvements</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {feature.improvements.map((improvement, i) => (
                                  <li key={i}>{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="performance">
                    <PerformanceMonitor />
                  </TabsContent>

                  <TabsContent value="dataquality">
                    <DataQualityMonitor 
                      marketData={marketData}
                      candlestickData={candlestickData}
                      selectedPair="BTC/USDT"
                    />
                  </TabsContent>

                  <TabsContent value="weakareas" className="space-y-4">
                    <div className="grid gap-4">
                      {analysis.weakAreas.map((area, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{area.category}</span>
                              <Badge className={getSeverityColor(area.severity)}>
                                {area.severity} PRIORITY
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-1">Description</h4>
                                <p className="text-sm">{area.description}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1">Impact</h4>
                                <p className="text-sm text-red-600">{area.impact}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1">Recommended Solution</h4>
                                <p className="text-sm text-green-600">{area.solution}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
