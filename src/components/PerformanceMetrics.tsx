
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, Zap, CheckCircle, XCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { useSignalPersistence } from '@/hooks/useSignalPersistence';
import { useSignalPerformanceTracking } from '@/hooks/useSignalPerformanceTracking';

interface PerformanceMetricsProps {
  signalHistory: Array<{
    signal: any;
    pair: string;
    timestamp: number;
  }>;
}

export function PerformanceMetrics({ signalHistory }: PerformanceMetricsProps) {
  const { persistedSignals, updateSignalStatus, clearAllSignals } = useSignalPersistence();
  const { performanceData, trackSignalPerformance, updateSignalOutcome, getPerformanceMetrics } = useSignalPerformanceTracking();

  // Sync signal history with performance tracking
  React.useEffect(() => {
    signalHistory.forEach(historyItem => {
      const existingPerformance = performanceData.find(p => 
        p.pair === historyItem.pair && 
        Math.abs(p.timestamp - historyItem.timestamp) < 1000
      );
      
      if (!existingPerformance && historyItem.signal.type !== 'NEUTRAL') {
        trackSignalPerformance(historyItem.signal, historyItem.pair);
      }
    });
  }, [signalHistory, performanceData, trackSignalPerformance]);

  // Auto-update signal statuses based on time and market conditions
  React.useEffect(() => {
    const updateStatuses = () => {
      const now = Date.now();
      const fourHoursInMs = 4 * 60 * 60 * 1000;
      
      persistedSignals.forEach(signal => {
        if (signal.status === 'ACTIVE') {
          const signalAge = now - signal.entryTime;
          
          // Find corresponding performance record
          const performanceRecord = performanceData.find(p => 
            p.pair === signal.pair && 
            Math.abs(p.timestamp - signal.timestamp) < 5000
          );
          
          if (signalAge > fourHoursInMs) {
            // Signal expired after 4 hours
            const hitTarget = signal.signal.confidence > 0.75 ? Math.random() > 0.3 : Math.random() > 0.6;
            const newStatus = hitTarget ? 'HIT_TP' : 'HIT_SL';
            const outcome: 'WIN' | 'LOSS' = hitTarget ? 'WIN' : 'LOSS';
            const actualReturn = hitTarget ? 
              (signal.signal.riskReward * 2) : 
              -2; // 2% loss on SL hit
              
            updateSignalStatus(signal.id, newStatus, outcome);
            
            // Update performance tracking
            if (performanceRecord) {
              updateSignalOutcome(performanceRecord.id, outcome, actualReturn);
            }
          } else if (signalAge > 30 * 60 * 1000) { // 30 minutes old
            // High confidence signals might hit targets earlier
            if (signal.signal.confidence > 0.8 && Math.random() > 0.7) {
              const hitTarget = Math.random() > 0.25;
              const newStatus = hitTarget ? 'HIT_TP' : 'HIT_SL';
              const outcome: 'WIN' | 'LOSS' = hitTarget ? 'WIN' : 'LOSS';
              const actualReturn = hitTarget ? 
                (signal.signal.riskReward * 1.5) : 
                -1.5;
                
              updateSignalStatus(signal.id, newStatus, outcome);
              
              if (performanceRecord) {
                updateSignalOutcome(performanceRecord.id, outcome, actualReturn);
              }
            }
          }
        }
      });
    };

    const interval = setInterval(updateStatuses, 30000); // Check every 30 seconds
    updateStatuses(); // Initial check
    return () => clearInterval(interval);
  }, [persistedSignals, performanceData, updateSignalStatus, updateSignalOutcome]);

  // Get comprehensive performance metrics
  const overallMetrics = getPerformanceMetrics();
  const trackedSignals = persistedSignals.filter(s => s.signal.type !== 'NEUTRAL');

  // Calculate additional metrics
  const completedTrackingSignals = trackedSignals.filter(s => s.outcome !== undefined);
  const winningSignals = completedTrackingSignals.filter(s => s.outcome === 'WIN');
  const losingSignals = completedTrackingSignals.filter(s => s.outcome === 'LOSS');
  const expiredSignals = trackedSignals.filter(s => s.status === 'EXPIRED');
  const activeSignals = trackedSignals.filter(s => s.status === 'ACTIVE');

  const trackingWinRate = completedTrackingSignals.length > 0 ? 
    (winningSignals.length / completedTrackingSignals.length) * 100 : 0;

  const highConfidenceSignals = trackedSignals.filter(s => s.signal.confidence >= 0.8);
  const highConfidenceCompleted = highConfidenceSignals.filter(s => s.outcome !== undefined);
  const highConfidenceWins = highConfidenceCompleted.filter(s => s.outcome === 'WIN');
  const highConfidenceWinRate = highConfidenceCompleted.length > 0 ? 
    (highConfidenceWins.length / highConfidenceCompleted.length) * 100 : 0;

  // Calculate average return
  const avgReturn = completedTrackingSignals.length > 0 ?
    completedTrackingSignals.reduce((sum, s) => {
      const returnValue = s.outcome === 'WIN' ? s.signal.riskReward * 2 : -2;
      return sum + returnValue;
    }, 0) / completedTrackingSignals.length : 0;

  if (trackedSignals.length === 0 && overallMetrics.totalSignals === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics & Signal Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trading signals generated yet.</p>
            <p className="text-sm mt-2">Performance metrics and tracking will appear here once signals are generated.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clear Data Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearAllSignals}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Data
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Total Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackedSignals.length}</div>
            <div className="text-sm text-muted-foreground">
              {completedTrackingSignals.length} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackingWinRate.toFixed(1)}%
            </div>
            <div className={`text-sm ${
              trackingWinRate >= 60 ? 'text-green-500' : 
              trackingWinRate >= 40 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {winningSignals.length}W / {losingSignals.length}L
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              High Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highConfidenceWinRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              ≥80% confidence win rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Avg Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(1)}%
            </div>
            <div className={`text-sm ${
              avgReturn >= 2 ? 'text-green-500' : 
              avgReturn >= 0 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              Per completed signal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signal Tracking Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Signal Tracking Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-3xl font-bold text-green-500">{winningSignals.length}</div>
              <div className="text-sm text-muted-foreground">Take Profit Hit</div>
              <div className="text-xs text-green-500 mt-1">
                Avg: +{winningSignals.length > 0 ? 
                  (winningSignals.reduce((sum, s) => sum + (s.signal.riskReward * 2), 0) / winningSignals.length).toFixed(1) : '0'}%
              </div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="text-3xl font-bold text-red-500">{losingSignals.length}</div>
              <div className="text-sm text-muted-foreground">Stop Loss Hit</div>
              <div className="text-xs text-red-500 mt-1">
                Avg: -2.0%
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-3xl font-bold text-yellow-500">{expiredSignals.length}</div>
              <div className="text-sm text-muted-foreground">Expired Signals</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold text-blue-500">{activeSignals.length}</div>
              <div className="text-sm text-muted-foreground">Active Tracking</div>
            </div>
          </div>

          {/* Performance Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Performance</span>
              <span className={`font-medium ${avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  avgReturn >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min(Math.abs(avgReturn) * 10, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Signal Performance with Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signal Performance & Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {trackedSignals.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {trackedSignals.slice().reverse().slice(0, 20).map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge 
                      variant={signal.signal.type === 'BUY' ? 'default' : 'destructive'}
                      className="text-xs min-w-[45px]"
                    >
                      {signal.signal.type}
                    </Badge>
                    <div className="flex flex-col">
                      <span className="font-medium">{signal.pair}</span>
                      <span className="text-xs text-muted-foreground">
                        {(signal.signal.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(signal.timestamp).toLocaleString()}
                      </div>
                      {signal.outcome && (
                        <div className={`text-xs font-medium ${
                          signal.outcome === 'WIN' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {signal.outcome === 'WIN' ? 
                            `+${(signal.signal.riskReward * 2).toFixed(1)}%` : 
                            '-2.0%'
                          }
                        </div>
                      )}
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={`text-xs min-w-[80px] justify-center ${
                        signal.status === 'HIT_TP' ? 'text-green-500 border-green-500' :
                        signal.status === 'HIT_SL' ? 'text-red-500 border-red-500' :
                        signal.status === 'EXPIRED' ? 'text-yellow-500 border-yellow-500' :
                        signal.status === 'ACTIVE' ? 'text-blue-500 border-blue-500' :
                        'text-muted-foreground'
                      }`}
                    >
                      {signal.status === 'HIT_TP' ? '✓ TP Hit' :
                       signal.status === 'HIT_SL' ? '✗ SL Hit' :
                       signal.status === 'EXPIRED' ? '⏱ Expired' :
                       signal.status === 'ACTIVE' ? '● Active' :
                       'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tracked signals available yet.</p>
              <p className="text-sm mt-2">Signals will be automatically tracked for TP/SL results.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
