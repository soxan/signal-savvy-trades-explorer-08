
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { MarketData } from '@/lib/types/marketData';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';

interface PriceAlertsPanelProps {
  marketData: MarketData[];
}

export function PriceAlertsPanel({ marketData }: PriceAlertsPanelProps) {
  const { alerts, activeAlerts, addAlert, removeAlert, clearAllAlerts, isLoaded } = usePriceAlerts();
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    type: 'ABOVE' as 'ABOVE' | 'BELOW',
    targetPrice: ''
  });
  const [validationError, setValidationError] = useState('');

  const validateAndCreateAlert = () => {
    setValidationError('');

    if (!newAlert.symbol || !newAlert.targetPrice) {
      setValidationError('Please fill all fields');
      return;
    }

    const market = marketData.find(m => m.symbol === newAlert.symbol);
    if (!market) {
      setValidationError('Selected symbol not found in market data');
      return;
    }

    const targetPrice = parseFloat(newAlert.targetPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setValidationError('Please enter a valid price');
      return;
    }

    // Logical validation
    if (newAlert.type === 'ABOVE' && targetPrice <= market.price) {
      setValidationError(`Target price must be above current price ($${market.price.toLocaleString()})`);
      return;
    }

    if (newAlert.type === 'BELOW' && targetPrice >= market.price) {
      setValidationError(`Target price must be below current price ($${market.price.toLocaleString()})`);
      return;
    }

    addAlert(newAlert.symbol, newAlert.type, targetPrice, market.price);
    
    setNewAlert({ symbol: '', type: 'ABOVE', targetPrice: '' });
    setIsCreating(false);
    setValidationError('');
  };

  const getCurrentPrice = (symbol: string) => {
    const market = marketData.find(m => m.symbol === symbol);
    return market ? market.price : 0;
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4" />
            Price Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="default" className="text-xs">
                {activeAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
              className="h-6 px-2"
            >
              <Plus className="w-3 h-3" />
            </Button>
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllAlerts}
                className="h-6 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {isCreating && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-2">
              <Select value={newAlert.symbol} onValueChange={(value) => setNewAlert(prev => ({ ...prev, symbol: value }))}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Symbol" />
                </SelectTrigger>
                <SelectContent>
                  {marketData.map(market => (
                    <SelectItem key={market.symbol} value={market.symbol}>
                      <div className="flex items-center justify-between w-full">
                        <span>{market.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ${market.price.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={newAlert.type} onValueChange={(value: 'ABOVE' | 'BELOW') => setNewAlert(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABOVE">Above</SelectItem>
                  <SelectItem value="BELOW">Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Input
                type="number"
                placeholder="Target price"
                value={newAlert.targetPrice}
                onChange={(e) => setNewAlert(prev => ({ ...prev, targetPrice: e.target.value }))}
                className="h-8"
                step="0.01"
                min="0"
              />
              {newAlert.symbol && (
                <p className="text-xs text-muted-foreground">
                  Current: ${getCurrentPrice(newAlert.symbol).toLocaleString()}
                </p>
              )}
            </div>
            
            {validationError && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                {validationError}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button size="sm" onClick={validateAndCreateAlert} className="h-6 text-xs">
                Create Alert
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setIsCreating(false);
                setValidationError('');
                setNewAlert({ symbol: '', type: 'ABOVE', targetPrice: '' });
              }} className="h-6 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No price alerts set</p>
            <p className="text-xs mt-1">Create alerts to get notified of price movements</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice().reverse().map((alert) => {
              const currentPrice = getCurrentPrice(alert.symbol);
              const priceDistance = alert.isActive && currentPrice > 0 
                ? Math.abs(currentPrice - alert.targetPrice) / alert.targetPrice * 100 
                : 0;

              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded border text-sm transition-colors ${
                    alert.isActive ? 'bg-card/50 hover:bg-card/70' : 'bg-muted/30 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {alert.isActive ? (
                      <Bell className="w-3 h-3 text-blue-500" />
                    ) : (
                      <BellOff className="w-3 h-3 text-muted-foreground" />
                    )}
                    
                    {alert.type === 'ABOVE' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.symbol}</span>
                        {alert.triggeredAt && (
                          <Badge variant="secondary" className="text-xs px-1">
                            Triggered
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {alert.type.toLowerCase()} ${alert.targetPrice.toLocaleString()}
                        {alert.isActive && currentPrice > 0 && (
                          <span className="ml-2">• {priceDistance.toFixed(1)}% away</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {alert.isActive && currentPrice > 0 && (
                      <div className="text-right text-xs">
                        <div className="text-muted-foreground">Current</div>
                        <div className="font-medium">${currentPrice.toLocaleString()}</div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlert(alert.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total: {alerts.length} alerts</span>
              <div className="flex gap-3">
                <span>Active: {activeAlerts.length}</span>
                <span>Triggered: {alerts.filter(a => a.triggeredAt).length}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
