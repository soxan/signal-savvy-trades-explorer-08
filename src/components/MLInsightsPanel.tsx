
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';

interface MLInsightsPanelProps {
  mlSignal: any;
  mlStats: {
    initialized: boolean;
    hasSentimentAnalysis: boolean;
    hasPricePredictor: boolean;
    hasMarketRegimeModel: boolean;
  };
  isProcessing: boolean;
  onInitializeML: () => void;
}

export function MLInsightsPanel({ 
  mlSignal, 
  mlStats, 
  isProcessing, 
  onInitializeML 
}: MLInsightsPanelProps) {
  if (!mlStats.initialized) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ML Enhancement System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Initialize the ML system for enhanced signal analysis
            </p>
            <Button 
              onClick={onInitializeML} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Initializing ML Models...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Initialize ML System
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mlSignal) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-500" />
            ML System Ready
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mlStats.hasSentimentAnalysis ? 'bg-green-500' : 'bg-gray-400'}`} />
              Sentiment Analysis
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mlStats.hasPricePredictor ? 'bg-green-500' : 'bg-gray-400'}`} />
              Price Predictor
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mlStats.hasMarketRegimeModel ? 'bg-green-500' : 'bg-gray-400'}`} />
              Market Regime
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-4">
            Waiting for sufficient data to generate ML-enhanced signals...
          </p>
        </CardContent>
      </Card>
    );
  }

  const { mlPrediction, mlConfidence, hybridConfidence, adaptiveLeverage, mlRecommendation } = mlSignal;

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'BULL': return 'bg-green-500';
      case 'BEAR': return 'bg-red-500';
      case 'VOLATILE': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'UP': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'DOWN': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          ML Enhanced Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ML Prediction Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getDirectionIcon(mlPrediction.priceDirection)}
              <span className="font-medium">{mlPrediction.priceDirection}</span>
            </div>
            <Progress 
              value={mlConfidence * 100} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground">
              ML Confidence: {(mlConfidence * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge className={`${getRegimeColor(mlPrediction.marketRegime)} text-white`}>
              {mlPrediction.marketRegime}
            </Badge>
            <Progress 
              value={hybridConfidence * 100} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground">
              Hybrid Confidence: {(hybridConfidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Risk Assessment</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Risk Score:</span>
              <span className="ml-2 font-medium">
                {(mlPrediction.riskScore * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Adaptive Leverage:</span>
              <span className="ml-2 font-medium">{adaptiveLeverage}x</span>
            </div>
          </div>
        </div>

        {/* Price Range Prediction */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Price Range Forecast</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Min:</span>
              <span className="ml-2 font-medium text-red-500">
                ${mlPrediction.nextPriceRange.min.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Max:</span>
              <span className="ml-2 font-medium text-green-500">
                ${mlPrediction.nextPriceRange.max.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* ML Recommendation */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">ML Recommendation:</p>
          <p className="text-sm text-muted-foreground">{mlRecommendation}</p>
        </div>

        {/* Enhanced Signal Metrics */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Entry</p>
            <p className="font-medium">${mlSignal.entry.toFixed(6)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Stop Loss</p>
            <p className="font-medium text-red-500">${mlSignal.stopLoss.toFixed(6)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Take Profit</p>
            <p className="font-medium text-green-500">${mlSignal.takeProfit.toFixed(6)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
