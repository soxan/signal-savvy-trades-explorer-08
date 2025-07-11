
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Zap,
  Settings,
  Bug
} from 'lucide-react';
import { SystemMetrics, DebugEvent } from '@/hooks/useSystemDebugger';

interface SystemDebugDashboardProps {
  metrics: SystemMetrics;
  debugEvents: DebugEvent[];
  onRunAnalysis: () => void;
  onOptimizeThresholds: () => void;
  optimizedThresholds?: {
    confidenceThreshold: number;
    qualityThreshold: number;
    reason: string;
  };
}

export function SystemDebugDashboard({ 
  metrics, 
  debugEvents, 
  onRunAnalysis,
  onOptimizeThresholds,
  optimizedThresholds
}: SystemDebugDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getHealthStatus = () => {
    const issues = metrics.performanceIssues.length;
    const dataQuality = metrics.dataQualityScore;
    const rejectionRate = metrics.signalStats.total > 0 ? 
      (metrics.signalStats.rejected / metrics.signalStats.total) * 100 : 0;

    if (issues === 0 && dataQuality > 80 && rejectionRate < 20) return 'excellent';
    if (issues < 2 && dataQuality > 60 && rejectionRate < 50) return 'good';
    if (issues < 4 && dataQuality > 40 && rejectionRate < 80) return 'fair';
    return 'poor';
  };

  const healthStatus = getHealthStatus();
  const healthColors = {
    excellent: 'text-green-500 border-green-500',
    good: 'text-blue-500 border-blue-500',
    fair: 'text-yellow-500 border-yellow-500',
    poor: 'text-red-500 border-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Header with Health Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6" />
            <h2 className="text-2xl font-bold">System Debug Dashboard</h2>
          </div>
          <Badge 
            variant="outline" 
            className={`${healthColors[healthStatus]} font-medium`}
          >
            System Health: {healthStatus.toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onRunAnalysis} variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Run Analysis
          </Button>
          <Button onClick={onOptimizeThresholds} variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Performance Issues Alert */}
      {metrics.performanceIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Issues Detected:</strong>
            <ul className="mt-2 list-disc list-inside">
              {metrics.performanceIssues.map((issue, index) => (
                <li key={index} className="text-sm">{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Optimized Thresholds */}
      {optimizedThresholds && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Optimized Thresholds:</strong> Confidence {(optimizedThresholds.confidenceThreshold * 100).toFixed(1)}%, 
            Quality {optimizedThresholds.qualityThreshold}. {optimizedThresholds.reason}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signals">Signal Analysis</TabsTrigger>
          <TabsTrigger value="data">Data Quality</TabsTrigger>
          <TabsTrigger value="events">Debug Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Data Quality Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Data Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dataQualityScore}%</div>
                <Progress value={metrics.dataQualityScore} className="mt-2" />
              </CardContent>
            </Card>

            {/* Signal Generation Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Signal Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.signalGenerationRate}</div>
                <div className="text-sm text-muted-foreground">per minute</div>
              </CardContent>
            </Card>

            {/* Processing Time */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Avg Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.averageProcessingTime.toFixed(0)}ms</div>
                <div className="text-sm text-muted-foreground">per analysis</div>
              </CardContent>
            </Card>

            {/* Signal Acceptance Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Acceptance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.signalStats.total > 0 ? 
                    Math.round((metrics.signalStats.accepted / metrics.signalStats.total) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {metrics.signalStats.accepted}/{metrics.signalStats.total}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Signal Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Signal Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">BUY Signals</span>
                  <Badge variant="default">{metrics.signalStats.buy}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">SELL Signals</span>
                  <Badge variant="destructive">{metrics.signalStats.sell}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">NEUTRAL Signals</span>
                  <Badge variant="secondary">{metrics.signalStats.neutral}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Generated</span>
                  <Badge variant="outline">{metrics.signalStats.total}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Signal Quality Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Signal Quality Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Accepted:</span>
                    <span className="text-green-600">{metrics.signalStats.accepted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected:</span>
                    <span className="text-red-600">{metrics.signalStats.rejected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejection Rate:</span>
                    <span className={metrics.signalStats.total > 0 && 
                      (metrics.signalStats.rejected / metrics.signalStats.total) > 0.8 ? 
                      'text-red-600' : 'text-green-600'}>
                      {metrics.signalStats.total > 0 ? 
                        Math.round((metrics.signalStats.rejected / metrics.signalStats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Volume Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Volume</div>
                  <div className="text-lg font-bold">
                    ${(metrics.volumeAnalysis.currentVolume / 1e9).toFixed(2)}B
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Expected Minimum</div>
                  <div className="text-lg font-bold">
                    ${(metrics.volumeAnalysis.expectedMinimum / 1e9).toFixed(2)}B
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={metrics.volumeAnalysis.isRealistic ? 'default' : 'destructive'}>
                  {metrics.volumeAnalysis.isRealistic ? 'Realistic' : 'Below Threshold'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Adjusted: ${(metrics.volumeAnalysis.adjustedThreshold / 1e9).toFixed(2)}B
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Debug Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {debugEvents.slice().reverse().map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        {new Date(event.timestamp).toLocaleTimeString()}
                        {event.processingTime && (
                          <span className="text-muted-foreground ml-2">
                            ({event.processingTime}ms)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {JSON.stringify(event.data).substring(0, 100)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
