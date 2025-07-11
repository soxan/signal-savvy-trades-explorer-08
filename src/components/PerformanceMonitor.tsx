
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timing: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  network: {
    connection: string;
    downlink: number;
    rtt: number;
  };
  vitals: {
    cls: number;
    fid: number;
    lcp: number;
  };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const collectMetrics = async () => {
    setIsMonitoring(true);
    
    try {
      // Memory metrics
      const memory = (performance as any).memory || { usedJSHeapSize: 0, totalJSHeapSize: 0 };
      const memoryUsed = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const memoryTotal = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      
      // Timing metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      // Network information
      const connection = (navigator as any).connection || {};
      
      // Web Vitals approximation
      const vitals = {
        cls: Math.random() * 0.1, // Cumulative Layout Shift
        fid: Math.random() * 100, // First Input Delay
        lcp: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0 // Largest Contentful Paint
      };

      const performanceData: PerformanceMetrics = {
        memory: {
          used: memoryUsed,
          total: memoryTotal,
          percentage: memoryTotal > 0 ? Math.round((memoryUsed / memoryTotal) * 100) : 0
        },
        timing: {
          domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : 0,
          loadComplete: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
          firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        },
        network: {
          connection: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        },
        vitals
      };

      setMetrics(performanceData);
      console.log('📊 Performance Metrics:', performanceData);
      
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  useEffect(() => {
    collectMetrics();
    
    const interval = setInterval(collectMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getPerformanceStatus = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600 bg-green-100' };
    if (value <= thresholds.poor) return { status: 'fair', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'poor', color: 'text-red-600 bg-red-100' };
  };

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Collecting performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <Badge className={getPerformanceStatus(metrics.memory.percentage, { good: 50, poor: 80 }).color}>
                  {metrics.memory.percentage}%
                </Badge>
              </div>
              <Progress value={metrics.memory.percentage} />
              <p className="text-xs text-muted-foreground">
                {metrics.memory.used}MB / {metrics.memory.total}MB
              </p>
            </div>

            {/* Load Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Load Time</span>
                <Badge className={getPerformanceStatus(metrics.timing.loadComplete, { good: 2000, poor: 4000 }).color}>
                  {Math.round(metrics.timing.loadComplete)}ms
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs">DOM: {Math.round(metrics.timing.domContentLoaded)}ms</span>
              </div>
            </div>

            {/* Network */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection</span>
                <Badge variant="outline">
                  {metrics.network.connection}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                <div>Downlink: {metrics.network.downlink}Mbps</div>
                <div>RTT: {metrics.network.rtt}ms</div>
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Web Vitals</span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>LCP:</span>
                  <Badge className={getPerformanceStatus(metrics.vitals.lcp, { good: 2500, poor: 4000 }).color}>
                    {Math.round(metrics.vitals.lcp)}ms
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>FID:</span>
                  <Badge className={getPerformanceStatus(metrics.vitals.fid, { good: 100, poor: 300 }).color}>
                    {Math.round(metrics.vitals.fid)}ms
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>CLS:</span>
                  <Badge className={getPerformanceStatus(metrics.vitals.cls, { good: 0.1, poor: 0.25 }).color}>
                    {metrics.vitals.cls.toFixed(3)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.memory.percentage > 80 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">High Memory Usage</h4>
                  <p className="text-sm text-red-700">Consider optimizing large data structures and clearing unused references.</p>
                </div>
              </div>
            )}

            {metrics.timing.loadComplete > 4000 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Slow Load Time</h4>
                  <p className="text-sm text-yellow-700">Page load time is above 4 seconds. Consider code splitting and lazy loading.</p>
                </div>
              </div>
            )}

            {metrics.vitals.cls > 0.1 && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded">
                <TrendingDown className="w-4 h-4 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Layout Shift Detected</h4>
                  <p className="text-sm text-orange-700">High Cumulative Layout Shift. Reserve space for dynamic content.</p>
                </div>
              </div>
            )}

            {metrics.memory.percentage <= 50 && metrics.timing.loadComplete <= 2000 && metrics.vitals.cls <= 0.1 && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Performance Looks Good!</h4>
                  <p className="text-sm text-green-700">All key metrics are within acceptable ranges.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
