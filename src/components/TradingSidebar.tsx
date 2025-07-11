
import { TradingControls } from './TradingControls';
import { PriceAlertsPanel } from './PriceAlertsPanel';
import { MarketData } from '@/lib/dataService';

interface TradingSidebarProps {
  selectedPair: string;
  selectedTimeframe: string;
  onPairChange: (pair: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  marketData: MarketData[];
}

export function TradingSidebar({
  selectedPair,
  selectedTimeframe,
  onPairChange,
  onTimeframeChange,
  marketData
}: TradingSidebarProps) {
  return (
    <div className="col-span-12 md:col-span-3 space-y-6">
      <TradingControls
        selectedPair={selectedPair}
        selectedTimeframe={selectedTimeframe}
        onPairChange={onPairChange}
        onTimeframeChange={onTimeframeChange}
        marketData={marketData}
      />
      
      {/* Price Alerts Panel */}
      {marketData && marketData.length > 0 && (
        <PriceAlertsPanel marketData={marketData} />
      )}
    </div>
  );
}
