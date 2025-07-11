
import { SignalCard } from './SignalCard';
import { MarketDataCards } from './MarketDataCards';
import { TradingTabs } from './TradingTabs';
import { CandlestickData, TradingSignal } from '@/lib/technicalAnalysis';
import { MarketData } from '@/lib/dataService';

interface TradingMainContentProps {
  selectedPair: string;
  selectedTimeframe: string;
  currentSignal: TradingSignal | null;
  selectedMarketData: MarketData | undefined;
  isMarketLoading: boolean;
  lastMarketUpdate: Date;
  candlestickData: CandlestickData[] | undefined;
  signalHistory: Array<{ signal: TradingSignal; pair: string; timestamp: number }>;
}

export function TradingMainContent({
  selectedPair,
  selectedTimeframe,
  currentSignal,
  selectedMarketData,
  isMarketLoading,
  lastMarketUpdate,
  candlestickData,
  signalHistory
}: TradingMainContentProps) {
  return (
    <div className="col-span-12 md:col-span-9 space-y-6">
      {/* Current Signal */}
      {currentSignal && selectedMarketData && (
        <SignalCard
          signal={currentSignal}
          marketData={selectedMarketData}
          pair={selectedPair}
        />
      )}

      {/* Market Data Cards */}
      <MarketDataCards 
        marketData={selectedMarketData}
        isLoading={isMarketLoading}
        lastUpdated={lastMarketUpdate}
      />

      {/* Chart and Analysis */}
      <TradingTabs
        selectedPair={selectedPair}
        selectedTimeframe={selectedTimeframe}
        candlestickData={candlestickData}
        currentSignal={currentSignal}
        signalHistory={signalHistory}
      />
    </div>
  );
}
