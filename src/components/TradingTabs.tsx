
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriceChart } from './PriceChart';
import { PerformanceMetrics } from './PerformanceMetrics';
import { SignalHistoryCard } from './SignalHistoryCard';
import { PaperTradingPanel } from './PaperTradingPanel';
import { SimpleMarketConditions } from './SimpleMarketConditions';
import { CandlestickData, TradingSignal } from '@/lib/technicalAnalysis';
import { useTradingData } from '@/hooks/useTradingData';

interface TradingTabsProps {
  selectedPair: string;
  selectedTimeframe: string;
  candlestickData: CandlestickData[] | undefined;
  currentSignal: TradingSignal | null;
  signalHistory: Array<{ signal: TradingSignal; pair: string; timestamp: number }>;
}

export function TradingTabs({
  selectedPair,
  selectedTimeframe,
  candlestickData,
  currentSignal,
  signalHistory
}: TradingTabsProps) {
  const { marketData, selectedMarketData } = useTradingData(selectedPair, selectedTimeframe, true);

  return (
    <Tabs defaultValue="chart" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="chart">Price Chart</TabsTrigger>
        <TabsTrigger value="paper-trading">Paper Trading</TabsTrigger>
        <TabsTrigger value="signals">Signal History</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="market">Market Conditions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="chart" className="space-y-4">
        <PriceChart
          data={candlestickData || []}
          pair={selectedPair}
          timeframe={selectedTimeframe}
          signal={currentSignal}
        />
      </TabsContent>

      <TabsContent value="paper-trading" className="space-y-4">
        <PaperTradingPanel
          currentSignal={currentSignal}
          selectedPair={selectedPair}
          selectedMarketData={selectedMarketData}
          marketData={marketData || []}
        />
      </TabsContent>
      
      <TabsContent value="signals" className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Signal History</h3>
          {signalHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No signals generated yet. Signals will appear here as they are generated.
            </div>
          ) : (
            <div className="space-y-3">
              {signalHistory
                .slice()
                .reverse()
                .map((item, index) => (
                  <SignalHistoryCard
                    key={`${item.pair}-${item.timestamp}-${index}`}
                    signal={item.signal}
                    pair={item.pair}
                    timestamp={item.timestamp}
                  />
                ))}
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="performance" className="space-y-4">
        <PerformanceMetrics signalHistory={signalHistory} />
      </TabsContent>

      <TabsContent value="market" className="space-y-4">
        {marketData && marketData.length > 0 ? (
          <SimpleMarketConditions marketData={marketData} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Loading market conditions...
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
