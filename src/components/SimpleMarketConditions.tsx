
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { MarketData } from '@/lib/types/marketData';
import { useToast } from '@/hooks/use-toast';

interface SimpleMarketConditionsProps {
  marketData: MarketData[];
}

export function SimpleMarketConditions({ marketData }: SimpleMarketConditionsProps) {
  const { toast } = useToast();

  // Simple market condition analysis
  const analyzeConditions = () => {
    const conditions: Array<{
      symbol: string;
      condition: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      price: number;
      change: number;
    }> = [];

    marketData.forEach(data => {
      const price = data.price;
      const high24h = data.high24h;
      const low24h = data.low24h;
      const change = data.changePercent24h;

      // Near 24h high (within 2%)
      const distanceFromHigh = ((high24h - price) / high24h) * 100;
      if (distanceFromHigh <= 2 && distanceFromHigh >= 0) {
        conditions.push({
          symbol: data.symbol,
          condition: distanceFromHigh <= 0.5 ? 'At 24H High' : 'Near 24H High',
          severity: distanceFromHigh <= 0.5 ? 'high' : 'medium',
          description: `${distanceFromHigh.toFixed(1)}% from 24h high`,
          price,
          change
        });
      }

      // Near 24h low (within 2%)
      const distanceFromLow = ((price - low24h) / low24h) * 100;
      if (distanceFromLow <= 2 && distanceFromLow >= 0) {
        conditions.push({
          symbol: data.symbol,
          condition: distanceFromLow <= 0.5 ? 'At 24H Low' : 'Near 24H Low',
          severity: distanceFromLow <= 0.5 ? 'high' : 'medium',
          description: `${distanceFromLow.toFixed(1)}% from 24h low`,
          price,
          change
        });
      }

      // High volatility (>10% change)
      if (Math.abs(change) > 10) {
        conditions.push({
          symbol: data.symbol,
          condition: 'High Volatility',
          severity: Math.abs(change) > 20 ? 'high' : 'medium',
          description: `${Math.abs(change).toFixed(1)}% price movement`,
          price,
          change
        });
      }

      // Strong trend (>5% change with volume)
      if (Math.abs(change) > 5) {
        const trend = change > 0 ? 'Strong Uptrend' : 'Strong Downtrend';
        conditions.push({
          symbol: data.symbol,
          condition: trend,
          severity: 'medium',
          description: `${change.toFixed(1)}% in 24h`,
          price,
          change
        });
      }
    });

    return conditions.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const conditions = analyzeConditions();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getConditionIcon = (condition: string) => {
    if (condition.includes('High') || condition.includes('Uptrend')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (condition.includes('Low') || condition.includes('Downtrend')) {
      return <TrendingDown className="w-4 h-4" />;
    }
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (conditions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Market Conditions
          <Badge variant="outline" className="ml-auto">
            {conditions.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {conditions.slice(0, 10).map((condition, index) => (
          <div 
            key={`${condition.symbol}-${index}`}
            className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
          >
            <div className="flex items-center gap-3">
              {getConditionIcon(condition.condition)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{condition.symbol}</span>
                  <Badge variant={getSeverityColor(condition.severity)} className="text-xs">
                    {condition.condition}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {condition.description}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium text-sm">
                ${condition.price.toLocaleString()}
              </div>
              <div className={`text-xs ${condition.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {condition.change >= 0 ? '+' : ''}{condition.change.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}

        {conditions.length > 10 && (
          <div className="text-center pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing top 10 of {conditions.length} conditions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
