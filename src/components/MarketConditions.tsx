
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Activity, Zap, BarChart3, Volume2 } from 'lucide-react';
import { MarketData } from '@/lib/types/marketData';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { conditionAnalyzer } from '@/lib/services/conditionAnalyzer';
import { MarketCondition } from '@/lib/types/conditions';

interface MarketConditionsProps {
  marketData: MarketData[];
}

export function MarketConditions({ marketData }: MarketConditionsProps) {
  const { toast } = useToast();
  const lastNotifications = useRef<Set<string>>(new Set());

  // Configure analyzer for different assets
  useEffect(() => {
    marketData.forEach(data => {
      // Set higher sensitivity for major pairs
      const sensitivity = ['BTC/USDT', 'ETH/USDT'].includes(data.symbol) ? 'HIGH' : 'MEDIUM';
      conditionAnalyzer.setConfig(data.symbol, {
        symbol: data.symbol,
        sensitivity,
        customThresholds: {
          nearHighPercent: sensitivity === 'HIGH' ? 1.5 : 2.0,
          nearLowPercent: sensitivity === 'HIGH' ? 1.5 : 2.0,
          volatilityThreshold: 12,
          volumeSpike: 1.8
        }
      });
    });
  }, [marketData]);

  const conditions = conditionAnalyzer.analyzeAdvancedConditions(marketData);
  const criticalConditions = conditions.filter(c => c.severity === 'CRITICAL');
  const highConditions = conditions.filter(c => c.severity === 'HIGH');
  const mediumConditions = conditions.filter(c => c.severity === 'MEDIUM');
  const lowConditions = conditions.filter(c => c.severity === 'LOW');

  // Enhanced notifications for critical conditions
  useEffect(() => {
    [...criticalConditions, ...highConditions].forEach(condition => {
      const notificationKey = `${condition.symbol}-${condition.condition}-${condition.severity}`;
      
      if (!lastNotifications.current.has(notificationKey)) {
        let title = '';
        let message = '';
        
        switch (condition.condition) {
          case 'AT_HIGH':
            title = '🚨 24H High Alert!';
            message = `${condition.symbol} reached its 24h high! Current: $${condition.currentPrice.toLocaleString()}. ${condition.recommendation}`;
            break;
          case 'AT_LOW':
            title = '📉 24H Low Alert!';
            message = `${condition.symbol} reached its 24h low! Current: $${condition.currentPrice.toLocaleString()}. ${condition.recommendation}`;
            break;
          case 'BREAKOUT':
            title = '🚀 Breakout Alert!';
            message = `${condition.symbol} breakout detected! Price: $${condition.currentPrice.toLocaleString()} (${condition.confidence.toFixed(0)}% confidence)`;
            break;
          case 'BREAKDOWN':
            title = '📉 Breakdown Alert!';
            message = `${condition.symbol} breakdown detected! Price: $${condition.currentPrice.toLocaleString()} (${condition.confidence.toFixed(0)}% confidence)`;
            break;
          default:
            title = `⚠️ ${condition.condition.replace('_', ' ')} Alert!`;
            message = `${condition.symbol}: ${condition.recommendation}`;
        }
        
        // Show toast notification
        toast({
          title,
          description: message,
          variant: condition.severity === 'CRITICAL' ? "destructive" : "default",
        });
        
        // Add to notification center
        if ((window as any).addSystemNotification) {
          (window as any).addSystemNotification({
            type: 'MARKET_CONDITION',
            title,
            message,
            severity: condition.severity,
            data: condition
          });
        }
        
        lastNotifications.current.add(notificationKey);
        
        // Clean up old notifications after 5 minutes for critical, 10 for high
        const cleanupTime = condition.severity === 'CRITICAL' ? 5 * 60 * 1000 : 10 * 60 * 1000;
        setTimeout(() => {
          lastNotifications.current.delete(notificationKey);
        }, cleanupTime);
      }
    });
  }, [criticalConditions, highConditions, toast]);

  const getConditionIcon = (condition: MarketCondition['condition']) => {
    switch (condition) {
      case 'AT_HIGH':
      case 'NEAR_HIGH':
        return <TrendingUp className="w-4 h-4" />;
      case 'AT_LOW':
      case 'NEAR_LOW':
        return <TrendingDown className="w-4 h-4" />;
      case 'BREAKOUT':
        return <TrendingUp className="w-4 h-4" />;
      case 'BREAKDOWN':
        return <TrendingDown className="w-4 h-4" />;
      case 'VOLATILE':
        return <Zap className="w-4 h-4" />;
      case 'STABLE':
        return <Activity className="w-4 h-4" />;
      case 'SUPPORT_TEST':
        return <BarChart3 className="w-4 h-4" />;
      case 'RESISTANCE_TEST':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getConditionColor = (severity: MarketCondition['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-600/15 border-red-600/30';
      case 'HIGH':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'MEDIUM':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'LOW':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatConditionText = (condition: MarketCondition) => {
    const baseText = condition.condition.replace('_', ' ');
    const confidenceText = ` (${condition.confidence.toFixed(0)}% confidence)`;
    
    switch (condition.condition) {
      case 'AT_HIGH':
        return 'At 24h High' + confidenceText;
      case 'NEAR_HIGH':
        return `Near High (${condition.distancePercent.toFixed(1)}% away)` + confidenceText;
      case 'AT_LOW':
        return 'At 24h Low' + confidenceText;
      case 'NEAR_LOW':
        return `Near Low (${condition.distancePercent.toFixed(1)}% away)` + confidenceText;
      case 'BREAKOUT':
        return `Breakout Detected` + confidenceText;
      case 'BREAKDOWN':
        return `Breakdown Detected` + confidenceText;
      case 'VOLATILE':
        return `High Volatility (${condition.distancePercent.toFixed(1)}%)` + confidenceText;
      case 'STABLE':
        return `Low Volatility (${condition.distancePercent.toFixed(1)}%)` + confidenceText;
      default:
        return baseText + confidenceText;
    }
  };

  const ConditionGroup = ({ title, conditions, severity }: { 
    title: string; 
    conditions: MarketCondition[]; 
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' 
  }) => {
    if (conditions.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b">
          <h4 className="text-sm font-medium">{title}</h4>
          <Badge 
            variant={severity === 'CRITICAL' ? 'destructive' : severity === 'HIGH' ? 'destructive' : severity === 'MEDIUM' ? 'default' : 'secondary'}
            className="text-xs px-2"
          >
            {conditions.length}
          </Badge>
        </div>
        
        <div className="grid gap-2">
          {conditions.map((condition, index) => (
            <div 
              key={`${condition.symbol}-${condition.condition}-${index}`}
              className={`flex items-start justify-between p-3 rounded-lg border transition-colors hover:bg-card/70 ${getConditionColor(condition.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getConditionIcon(condition.condition)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{condition.symbol}</span>
                    {condition.additionalData?.trend && (
                      <Badge variant="outline" className="text-xs">
                        {condition.additionalData.trend}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs opacity-90 mb-2">
                    {formatConditionText(condition)}
                  </div>
                  <div className="text-xs opacity-80">
                    {condition.recommendation}
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="font-medium">${condition.currentPrice.toLocaleString()}</div>
                {condition.targetPrice !== condition.currentPrice && (
                  <div className="opacity-70">Target: ${condition.targetPrice.toLocaleString()}</div>
                )}
                {condition.additionalData?.volume && (
                  <div className="opacity-60 flex items-center gap-1 mt-1">
                    <Volume2 className="w-3 h-3" />
                    <span>{(condition.additionalData.volume / 1000000).toFixed(1)}M</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (conditions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-medium mb-1">Normal Market Conditions</p>
            <p className="text-xs text-muted-foreground">All assets trading within normal ranges</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-base">Market Conditions</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {criticalConditions.length > 0 && (
              <Badge variant="destructive" className="text-xs px-2">
                {criticalConditions.length} Critical
              </Badge>
            )}
            {highConditions.length > 0 && (
              <Badge variant="destructive" className="text-xs px-2 opacity-80">
                {highConditions.length} High
              </Badge>
            )}
            <Badge variant="outline" className="text-xs px-2">
              {conditions.length} Total
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4 max-h-80 overflow-y-auto">
        <ConditionGroup 
          title="🚨 Critical Conditions" 
          conditions={criticalConditions} 
          severity="CRITICAL" 
        />
        
        <ConditionGroup 
          title="🔥 High Priority" 
          conditions={highConditions} 
          severity="HIGH" 
        />
        
        <ConditionGroup 
          title="⚠️ Medium Priority" 
          conditions={mediumConditions} 
          severity="MEDIUM" 
        />
        
        <ConditionGroup 
          title="ℹ️ Low Priority" 
          conditions={lowConditions} 
          severity="LOW" 
        />

        {/* Enhanced Summary Footer */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold text-red-600">{criticalConditions.length}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-red-500">{highConditions.length}</div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-yellow-500">{mediumConditions.length}</div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-blue-500">{lowConditions.length}</div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
