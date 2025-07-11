
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MLInsightsPanel } from './MLInsightsPanel';
import { useMLEnhancedSignalGeneration } from '@/hooks/useMLEnhancedSignalGeneration';
import { useTradingData } from '@/hooks/useTradingData';
import { Brain, Zap, Settings } from 'lucide-react';

export function MLTradingDemo() {
  const [mlEnabled, setMLEnabled] = useState(true);
  const [enhanced, setEnhanced] = useState(true);
  const [selectedPair] = useState('BTCUSDT');

  const { candlestickData } = useTradingData(selectedPair, '1h', true);
  
  const {
    currentSignal,
    isProcessing,
    mlInitialized,
    mlStats,
    initializeML,
    clearMLCache
  } = useMLEnhancedSignalGeneration(candlestickData, selectedPair, {
    enhanced,
    mlEnabled,
    autoInitialize: true
  });

  return (
    <div className="space-y-6">
      {/* ML System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ML System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="ml-enabled" 
                checked={mlEnabled} 
                onCheckedChange={setMLEnabled}
              />
              <Label htmlFor="ml-enabled">Enable ML Enhancement</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="enhanced-analysis" 
                checked={enhanced} 
                onCheckedChange={setEnhanced}
              />
              <Label htmlFor="enhanced-analysis">Enhanced Analysis</Label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={initializeML} 
              disabled={isProcessing || mlInitialized}
              variant="outline"
            >
              <Brain className="w-4 h-4 mr-2" />
              {mlInitialized ? 'ML Initialized' : 'Initialize ML'}
            </Button>
            
            <Button 
              onClick={clearMLCache} 
              disabled={!mlInitialized}
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>

          {mlInitialized && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ ML System is active and processing {selectedPair} with {candlestickData?.length || 0} data points
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ML Insights Panel */}
      <MLInsightsPanel
        mlSignal={currentSignal}
        mlStats={mlStats}
        isProcessing={isProcessing}
        onInitializeML={initializeML}
      />

      {/* Signal Details (if available) */}
      {currentSignal && (
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Signal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Signal Type:</span>
                <span className="ml-2 font-medium">{currentSignal.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <span className="ml-2 font-medium">{(currentSignal.confidence * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Risk/Reward:</span>
                <span className="ml-2 font-medium">{currentSignal.riskReward.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Position Size:</span>
                <span className="ml-2 font-medium">{currentSignal.positionSize.toFixed(4)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
