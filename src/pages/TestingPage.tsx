
import { ComprehensiveTestSuite } from '@/components/ComprehensiveTestSuite';
import { FeatureTestDashboard } from '@/components/FeatureTestDashboard';
import { SystemTestDashboard } from '@/components/SystemTestDashboard';
import { ComprehensiveSystemAnalysis } from '@/components/ComprehensiveSystemAnalysis';
import { HighLeverageTradingPanel } from '@/components/HighLeverageTradingPanel';
import { useTradingData } from '@/hooks/useTradingData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube, Activity, Brain, ClipboardCheck, Zap } from 'lucide-react';
import { useState } from 'react';

export default function TestingPage() {
  const [selectedPair] = useState('BTC/USDT');
  const [selectedTimeframe] = useState('1h');
  
  const { candlestickData } = useTradingData(selectedPair, selectedTimeframe, true);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-6 h-6" />
              Comprehensive Testing & Analysis Suite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Complete system analysis from A to Z - testing every component, feature, and system aspect of your trading application including high-leverage ML pattern detection.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="comprehensive" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="comprehensive" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              A-Z Analysis
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Feature Tests
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Advanced Analysis
            </TabsTrigger>
            <TabsTrigger value="leverage" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              High-Leverage ML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comprehensive" className="space-y-6">
            <ComprehensiveTestSuite />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemTestDashboard />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <FeatureTestDashboard />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <ComprehensiveSystemAnalysis />
          </TabsContent>

          <TabsContent value="leverage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  High-Leverage ML Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Testing the integration of pattern detection with ML for 20x-25x leverage trading opportunities.
                </p>
                <HighLeverageTradingPanel 
                  candlestickData={candlestickData} 
                  selectedPair={selectedPair}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
