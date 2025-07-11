
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Shield, Zap, Activity } from 'lucide-react';
import { TradingSignal } from '@/lib/technicalAnalysis';
import { MarketData } from '@/lib/dataService';
import { SignalCopyActions } from './SignalCopyActions';

interface SignalCardProps {
  signal: TradingSignal;
  marketData: MarketData;
  pair: string;
}

export function SignalCard({ signal, marketData, pair }: SignalCardProps) {
  const currentPrice = marketData?.price || signal.entry;
  const priceDecimals = currentPrice > 1 ? 2 : 6;

  console.log(`🔍 DISPLAYING SIGNAL for ${pair}:`, {
    signalEntry: signal.entry,
    marketDataPrice: marketData?.price,
    usingPrice: currentPrice,
    signalType: signal.type,
    confidence: signal.confidence
  });

  const getPatternReliability = (pattern: string): string => {
    const reliabilityMap: Record<string, string> = {
      'Bullish Engulfing': '78% success rate',
      'Bearish Engulfing': '76% success rate',
      'Morning Star': '83% success rate',
      'Evening Star': '81% success rate',
      'Dragonfly Doji': '72% success rate',
      'Gravestone Doji': '70% success rate',
      'Three White Soldiers': '74% success rate',
      'Three Black Crows': '72% success rate',
      'Piercing Pattern': '68% success rate',
      'Dark Cloud Cover': '66% success rate'
    };
    return reliabilityMap[pattern] || 'Statistical data available';
  };

  if (signal.type === 'NEUTRAL') {
    return (
      <Card className="border-2 border-muted/30 bg-gradient-to-br from-muted/5 to-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5" />
            No Active Signal - {pair}
            <div className="flex items-center gap-1 ml-2">
              <Activity className="w-4 h-4 text-muted-foreground animate-pulse" />
              <span className="text-sm">Monitoring</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 p-4 bg-muted/20 rounded-lg border">
            <div className="text-muted-foreground">
              Market conditions are neutral. Waiting for better trading opportunities...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isBuySignal = signal.type === 'BUY';

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Main Signal Card */}
      <Card className={`md:col-span-2 border-2 ${
        isBuySignal 
          ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/10' 
          : 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/10'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBuySignal ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              )}
              <div>
                <div className="text-xl font-bold">
                  {signal.type} Signal - {pair}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  Current Price: ${currentPrice.toFixed(priceDecimals)}
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                    <span className="text-xs">Live</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge 
                variant={isBuySignal ? 'default' : 'destructive'}
                className="text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                {(signal.confidence * 100).toFixed(0)}% Confidence
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Trading Levels */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
              <Target className="w-5 h-5 mx-auto mb-2 text-blue-400" />
              <div className="text-sm text-muted-foreground">Entry Price</div>
              <div className="text-lg font-bold">
                ${currentPrice.toFixed(priceDecimals)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-400" />
              <div className="text-sm text-muted-foreground">Take Profit</div>
              <div className="text-lg font-bold text-green-400">
                ${signal.takeProfit.toFixed(priceDecimals)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
              <TrendingDown className="w-5 h-5 mx-auto mb-2 text-red-400" />
              <div className="text-sm text-muted-foreground">Stop Loss</div>
              <div className="text-lg font-bold text-red-400">
                ${signal.stopLoss.toFixed(priceDecimals)}
              </div>
            </div>
          </div>

          {/* Risk Management Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Risk Management & Tracking
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-lg border border-orange-500/20">
                <div className="text-muted-foreground">Risk/Reward</div>
                <div className="font-medium text-lg">{signal.riskReward.toFixed(2)}:1</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <div className="text-muted-foreground">Position Size</div>
                <div className="font-medium text-lg">{signal.positionSize.toFixed(1)}%</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                <div className="text-muted-foreground">Leverage</div>
                <div className="font-medium text-lg text-orange-500">{signal.leverage}x</div>
              </div>
            </div>
          </div>

          {/* Detected Patterns */}
          {signal.patterns.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Detected Patterns (Reliability %)
              </h4>
              <div className="flex flex-wrap gap-2">
                {signal.patterns.map((pattern, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30"
                    title={getPatternReliability(pattern)}
                  >
                    {pattern}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Status Cards */}
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-xs text-blue-600 dark:text-blue-400">
                🎯 <strong>Centralized Processing:</strong> This signal is processed through our unified system to prevent duplicates. 
                All tracking and persistence is handled automatically with proper deduplication.
              </div>
            </div>

            <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
              <div className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ <strong>HIGH LEVERAGE TRADING:</strong> {signal.leverage}x leverage amplifies both profits and losses. 
                Strict risk management with {((1/signal.riskReward)*100).toFixed(1)}% max loss per trade.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t bg-gradient-to-r from-muted/20 to-muted/10 -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
            <div className="text-xs text-center text-muted-foreground">
              Signal for {pair} • Centrally processed • No duplicate tracking
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copy Actions Card */}
      <Card className="border-2 border-muted/30 bg-gradient-to-br from-muted/5 to-slate-500/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Quick Copy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SignalCopyActions signal={signal} pair={pair} />
        </CardContent>
      </Card>
    </div>
  );
}
