import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { MarketData } from '@/lib/dataService';

interface TradingControlsProps {
  selectedPair: string;
  selectedTimeframe: string;
  onPairChange: (pair: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  marketData: MarketData[];
}

const tradingPairs = [
  'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT', 
  'XRP/USDT', 'DOGE/USDT', 'DOT/USDT', 'LINK/USDT', 'AVAX/USDT'
];

const timeframes = [
  { value: '5m', label: '5min' },
  { value: '15m', label: '15min' },
  { value: '1h', label: '1hour' },
  { value: '4h', label: '4hour' }
];

export function TradingControls({ 
  selectedPair, 
  selectedTimeframe, 
  onPairChange, 
  onTimeframeChange, 
  marketData 
}: TradingControlsProps) {
  return (
    <div className="space-y-6">
      {/* Trading Pair Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Trading Pairs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tradingPairs.map((pair) => {
            const marketInfo = marketData.find(data => data.symbol === pair);
            const isSelected = selectedPair === pair;
            
            return (
              <Button
                key={pair}
                variant={isSelected ? "default" : "ghost"}
                className={`w-full justify-between p-3 h-auto ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onPairChange(pair)}
              >
                <div className="text-left">
                  <div className="font-medium">{pair}</div>
                  {marketInfo && (
                    <div className="text-xs text-muted-foreground">
                      ${marketInfo.price.toLocaleString()}
                    </div>
                  )}
                </div>
                {marketInfo && (
                  <div className="text-right">
                    <div className={`text-xs flex items-center gap-1 ${
                      marketInfo.changePercent24h >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {marketInfo.changePercent24h >= 0 ? 
                        <TrendingUp className="w-3 h-3" /> : 
                        <TrendingDown className="w-3 h-3" />
                      }
                      {marketInfo.changePercent24h.toFixed(2)}%
                    </div>
                  </div>
                )}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Timeframe Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Timeframe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeframeChange(tf.value)}
                className={selectedTimeframe === tf.value ? 'ring-2 ring-primary' : ''}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {marketData.slice(0, 5).map((data, index) => (
              <div key={data.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="text-sm font-medium">{data.symbol}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${data.price > 1 ? data.price.toFixed(2) : data.price.toFixed(6)}
                  </div>
                  <div className={`text-xs ${data.changePercent24h >= 0 ? 'text-success' : 'text-danger'}`}>
                    {data.changePercent24h >= 0 ? '+' : ''}{data.changePercent24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total Market Cap:</span>
              <span>${marketData.reduce((sum, data) => sum + data.marketCap, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>24h Volume:</span>
              <span>${marketData.reduce((sum, data) => sum + data.volume24h, 0).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trading Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-success font-medium mb-1">Risk Management</p>
            <p>Never risk more than 2% of your capital on a single trade</p>
          </div>
          <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-warning font-medium mb-1">Pattern Recognition</p>
            <p>Multiple confirmations increase signal reliability</p>
          </div>
          <div className="p-3 bg-chart-3/10 rounded-lg border border-chart-3/20">
            <p className="text-chart-3 font-medium mb-1">Market Analysis</p>
            <p>Consider market sentiment and news events</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}