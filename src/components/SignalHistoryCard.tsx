
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Shield, Zap, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { TradingSignal } from '@/lib/technicalAnalysis';
import { SignalCopyActions } from './SignalCopyActions';
import { useState } from 'react';

interface SignalHistoryCardProps {
  signal: TradingSignal;
  pair: string;
  timestamp: number;
}

export function SignalHistoryCard({ signal, pair, timestamp }: SignalHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isBuySignal = signal.type === 'BUY';

  return (
    <Card className={`border-2 ${
      isBuySignal 
        ? 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/10' 
        : 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/10'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isBuySignal ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
            <div>
              <div className="font-medium text-lg">{signal.type} - {pair}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {new Date(timestamp).toLocaleString()}
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span>Historical</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isBuySignal ? 'default' : 'destructive'}
              className="text-sm bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {(signal.confidence * 100).toFixed(0)}%
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-muted/30"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Left side - Trading Details */}
            <div className="space-y-4">
              {/* Trading Levels */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                  <Target className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <div className="text-xs text-muted-foreground">Entry</div>
                  <div className="text-sm font-bold">
                    ${signal.entry.toFixed(6)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-400" />
                  <div className="text-xs text-muted-foreground">Take Profit</div>
                  <div className="text-sm font-bold text-green-400">
                    ${signal.takeProfit.toFixed(6)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
                  <TrendingDown className="w-4 h-4 mx-auto mb-1 text-red-400" />
                  <div className="text-xs text-muted-foreground">Stop Loss</div>
                  <div className="text-sm font-bold text-red-400">
                    ${signal.stopLoss.toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Risk Management Details */}
              <div className="space-y-2">
                <h5 className="text-sm font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Risk Management
                </h5>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center p-2 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded border border-orange-500/20">
                    <div className="text-muted-foreground">Risk/Reward</div>
                    <div className="font-medium">{signal.riskReward.toFixed(2)}:1</div>
                  </div>
                  <div className="text-center p-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded border border-purple-500/20">
                    <div className="text-muted-foreground">Position Size</div>
                    <div className="font-medium">{signal.positionSize.toFixed(1)}%</div>
                  </div>
                  <div className="text-center p-2 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded border border-yellow-500/20">
                    <div className="text-muted-foreground">Leverage</div>
                    <div className="font-medium text-orange-500">{signal.leverage}x</div>
                  </div>
                </div>
              </div>

              {/* Detected Patterns */}
              {signal.patterns.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Patterns
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {signal.patterns.map((pattern, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Copy Actions */}
            <div className="border-l pl-4 bg-gradient-to-br from-muted/5 to-slate-500/10 -mr-4 -my-4 pr-4 py-4 rounded-r-lg">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Copy Signal Data
              </h5>
              <SignalCopyActions signal={signal} pair={pair} size="sm" />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
