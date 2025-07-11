
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Eye, EyeOff, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketData } from '@/lib/dataService';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

interface PriceRangeAlertsProps {
  marketData: MarketData[];
}

interface PriceAlert {
  symbol: string;
  type: 'NEAR_HIGH' | 'NEAR_LOW' | 'AT_HIGH' | 'AT_LOW';
  distancePercent: number;
  opportunity: 'LONG' | 'SHORT';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  currentPrice: number;
  targetPrice: number;
}

export function PriceRangeAlerts({ marketData }: PriceRangeAlertsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const generatePriceAlerts = (): PriceAlert[] => {
    const alerts: PriceAlert[] = [];
    
    marketData.forEach(data => {
      if (data.high24h === 0 || data.low24h === 0) return;
      
      const currentPrice = data.price;
      const high24h = data.high24h;
      const low24h = data.low24h;
      
      const distanceFromHigh = ((high24h - currentPrice) / high24h) * 100;
      const distanceFromLow = ((currentPrice - low24h) / low24h) * 100;
      
      // Alert when near 24h high (potential short opportunity)
      if (distanceFromHigh <= 3) {
        alerts.push({
          symbol: data.symbol,
          type: distanceFromHigh <= 0.8 ? 'AT_HIGH' : 'NEAR_HIGH',
          distancePercent: distanceFromHigh,
          opportunity: 'SHORT',
          urgency: distanceFromHigh <= 0.8 ? 'HIGH' : distanceFromHigh <= 1.5 ? 'MEDIUM' : 'LOW',
          currentPrice: currentPrice,
          targetPrice: high24h
        });
      }
      
      // Alert when near 24h low (potential long opportunity)
      if (distanceFromLow <= 3) {
        alerts.push({
          symbol: data.symbol,
          type: distanceFromLow <= 0.8 ? 'AT_LOW' : 'NEAR_LOW',
          distancePercent: distanceFromLow,
          opportunity: 'LONG',
          urgency: distanceFromLow <= 0.8 ? 'HIGH' : distanceFromLow <= 1.5 ? 'MEDIUM' : 'LOW',
          currentPrice: currentPrice,
          targetPrice: low24h
        });
      }
    });
    
    return alerts.sort((a, b) => {
      const urgencyOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }
      return a.distancePercent - b.distancePercent;
    });
  };

  const alerts = generatePriceAlerts();
  const highPriorityAlerts = alerts.filter(alert => alert.urgency === 'HIGH');
  const displayAlerts = isExpanded ? alerts : alerts.slice(0, 4);

  const getAlertIcon = (type: PriceAlert['type'], urgency: PriceAlert['urgency']) => {
    const iconClass = urgency === 'HIGH' ? 'text-red-500' : urgency === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500';
    
    switch (type) {
      case 'AT_HIGH':
        return <ArrowDown className={`w-4 h-4 ${iconClass}`} />;
      case 'NEAR_HIGH':
        return <TrendingDown className={`w-4 h-4 ${iconClass}`} />;
      case 'AT_LOW':
        return <ArrowUp className={`w-4 h-4 ${iconClass}`} />;
      case 'NEAR_LOW':
        return <TrendingUp className={`w-4 h-4 ${iconClass}`} />;
    }
  };

  const getAlertBadgeColor = (urgency: PriceAlert['urgency']) => {
    switch (urgency) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'secondary';
    }
  };

  const getOpportunityBadgeColor = (opportunity: PriceAlert['opportunity']) => {
    return opportunity === 'LONG' ? 'default' : 'outline';
  };

  const formatAlertDescription = (alert: PriceAlert) => {
    const isAtLevel = alert.type.includes('AT_');
    const level = alert.type.includes('HIGH') ? 'high' : 'low';
    const action = isAtLevel ? 'at' : 'near';
    
    return `${action} 24h ${level}`;
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No Range Alerts</p>
            <p className="text-xs text-muted-foreground mt-1">All assets are trading mid-range</p>
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
            <CardTitle className="text-base">Range Alerts</CardTitle>
            {highPriorityAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs px-2">
                {highPriorityAlerts.length} High
              </Badge>
            )}
          </div>
          
          {alerts.length > 4 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  +{alerts.length - 4} More
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {displayAlerts.map((alert, index) => (
            <div key={`${alert.symbol}-${alert.type}-${index}`}>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type, alert.urgency)}
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{alert.symbol}</span>
                      <Badge 
                        variant={getAlertBadgeColor(alert.urgency)} 
                        className="text-xs px-1.5 py-0"
                      >
                        {alert.urgency}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatAlertDescription(alert)} • {alert.distancePercent.toFixed(1)}% away
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right text-xs">
                    <div className="text-muted-foreground">Current</div>
                    <div className="font-medium">${alert.currentPrice.toLocaleString()}</div>
                  </div>
                  
                  <div className="w-px h-8 bg-border mx-1" />
                  
                  <Badge 
                    variant={getOpportunityBadgeColor(alert.opportunity)}
                    className="text-xs px-2 py-1 font-medium"
                  >
                    {alert.opportunity}
                  </Badge>
                </div>
              </div>
              
              {index < displayAlerts.length - 1 && (
                <Separator className="my-2 opacity-30" />
              )}
            </div>
          ))}
        </div>

        {alerts.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total: {alerts.length} alerts</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  High ({alerts.filter(a => a.urgency === 'HIGH').length})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  Medium ({alerts.filter(a => a.urgency === 'MEDIUM').length})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Low ({alerts.filter(a => a.urgency === 'LOW').length})
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
