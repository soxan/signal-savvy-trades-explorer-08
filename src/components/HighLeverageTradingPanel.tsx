
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Shield,
  RefreshCw,
  Flame,
  Activity
} from 'lucide-react';
import { useHighLeverageTrading } from '@/hooks/useHighLeverageTrading';
import { CandlestickData } from '@/lib/technicalAnalysis';

interface HighLeverageTradingPanelProps {
  candlestickData: CandlestickData[] | undefined;
  selectedPair: string;
}

export function HighLeverageTradingPanel({ 
  candlestickData, 
  selectedPair 
}: HighLeverageTradingPanelProps) {
  const { 
    analysis, 
    isAnalyzing, 
    refreshAnalysis, 
    hasSignal,
    marketSuitability,
    quickProfitPotential,
    liquidationRisk
  } = useHighLeverageTrading(candlestickData, selectedPair);

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'EXCELLENT': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'GOOD': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'POOR': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'AVOID': return 'bg-gradient-to-r from-red-500 to-pink-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  const getEntryTimingIcon = (timing: string) => {
    switch (timing) {
      case 'IMMEDIATE': return <Flame className="w-4 h-4 text-red-500" />;
      case 'WAIT_CONFIRMATION': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'AVOID': return <Shield className="w-4 h-4 text-gray-500" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 animate-pulse text-yellow-500" />
            High-Leverage Analysis
            <div className="flex items-center gap-1 ml-2">
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Processing</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">
              Analyzing patterns and ML signals for {selectedPair}...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Optimizing for 20x-25x leverage quick profits
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || !hasSignal) {
    return (
      <Card className="border-2 border-muted/30 bg-gradient-to-br from-muted/5 to-slate-500/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-500" />
              High-Leverage Analysis
            </div>
            <Button onClick={refreshAnalysis} variant="outline" size="sm" className="hover:bg-muted/50">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="p-4 bg-gradient-to-br from-muted/10 to-muted/20 rounded-lg border border-muted/30 mb-4">
              <Badge className={`${getSuitabilityColor(marketSuitability)} text-white mb-4 border-0`}>
                Market: {marketSuitability}
              </Badge>
              <p className="text-muted-foreground">
                No high-leverage opportunities detected for {selectedPair}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Waiting for reliable patterns with ML confirmation...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const signal = analysis.signal!;

  return (
    <div className="space-y-4">
      {/* Main Signal Card */}
      <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              <div>
                <div className="text-xl font-bold">
                  {signal.patternSignal?.type} Signal - {selectedPair}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {signal.patternSignal?.patternName} • ML Enhanced
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                    <span className="text-xs">Live Analysis</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                {signal.optimalLeverage}x Leverage
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <div className="text-sm text-muted-foreground">Quick Profit</div>
              <div className="text-lg font-bold text-green-500">
                {(quickProfitPotential * 100).toFixed(2)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
              <Target className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <div className="text-sm text-muted-foreground">Confidence</div>
              <div className="text-lg font-bold text-blue-500">
                {(signal.hybridConfidence * 100).toFixed(0)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-red-500" />
              <div className="text-sm text-muted-foreground">Liquidation Risk</div>
              <div className="text-lg font-bold text-red-500">
                {(liquidationRisk * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Entry Timing */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-muted/10 to-slate-500/10 rounded-lg border border-muted/30">
            <div className="flex items-center gap-3">
              {getEntryTimingIcon(signal.entryTiming)}
              <div>
                <div className="font-semibold">Entry Timing</div>
                <div className="text-sm text-muted-foreground">{signal.entryTiming.replace('_', ' ')}</div>
              </div>
            </div>
            <Badge className={`${getSuitabilityColor(analysis.marketSuitability)} text-white border-0`}>
              {analysis.marketSuitability}
            </Badge>
          </div>

          {/* Trading Levels */}
          <div className="space-y-3">
            <h4 className="font-semibold">Trading Levels</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <span className="text-muted-foreground">Entry:</span>
                <div className="font-medium">${signal.patternSignal?.entry.toFixed(6)}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                <span className="text-muted-foreground">Quick TP:</span>
                <div className="font-medium text-green-500">
                  ${signal.exitStrategy.quickTakeProfit.toFixed(6)}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
                <span className="text-muted-foreground">Stop Loss:</span>
                <div className="font-medium text-red-500">
                  ${signal.exitStrategy.stopLoss.toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* Profit Targets */}
          <div className="space-y-3">
            <h4 className="font-semibold">Profit Targets & Timing</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded border border-green-500/20">
                <div>
                  <span className="text-sm font-medium">Quick Profit</span>
                  <div className="text-xs text-muted-foreground">
                    ${signal.profitTargets.quick.price.toFixed(6)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {signal.profitTargets.quick.timeframe}min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {signal.profitTargets.quick.probability}% prob.
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded border border-blue-500/20">
                <div>
                  <span className="text-sm font-medium">Extended Target</span>
                  <div className="text-xs text-muted-foreground">
                    ${signal.profitTargets.extended.price.toFixed(6)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {signal.profitTargets.extended.timeframe}min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {signal.profitTargets.extended.probability}% prob.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ML + Pattern Analysis */}
          <div className="space-y-3">
            <h4 className="font-semibold">Analysis Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                <span className="text-muted-foreground">Pattern Confidence:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={signal.patternSignal?.confidence * 100} className="h-2" />
                  <span className="font-medium">
                    {(signal.patternSignal?.confidence * 100 || 0).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <span className="text-muted-foreground">ML Confidence:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={signal.mlConfidence * 100} className="h-2" />
                  <span className="font-medium">{(signal.mlConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Management */}
          <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-700">High-Leverage Risk Management</span>
            </div>
            <div className="text-sm space-y-1">
              <div>• Max hold time: {signal.exitStrategy.maxHoldTime} minutes</div>
              <div>• Trailing stop: {signal.exitStrategy.trailingStop ? 'Enabled' : 'Disabled'}</div>
              <div>• Risk score: {signal.riskScore.toFixed(0)}/100</div>
              <div>• Pattern reliability: {signal.patternSignal?.reliability}%</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
            <h5 className="font-semibold text-blue-700 mb-2">ML + Pattern Recommendation:</h5>
            <p className="text-sm">{signal.recommendation}</p>
          </div>

          <Button onClick={refreshAnalysis} variant="outline" className="w-full hover:bg-muted/50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
