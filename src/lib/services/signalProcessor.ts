
import { CandlestickData, TradingSignal } from '../technicalAnalysis';
import { MarketData } from '@/lib/types/marketData';
import { AdaptiveSignalProcessor } from './signalProcessing/adaptiveSignalProcessor';
import { StandardSignalProcessor } from './signalProcessing/standardSignalProcessor';

export class SignalProcessor {
  private adaptiveProcessor = new AdaptiveSignalProcessor();
  private standardProcessor = new StandardSignalProcessor();

  async processAdaptiveSignal(
    candlestickData: CandlestickData[], 
    selectedPair: string, 
    marketData: MarketData[]
  ): Promise<TradingSignal> {
    try {
      return await this.adaptiveProcessor.processAdaptiveSignal(candlestickData, selectedPair, marketData);
    } catch (error) {
      console.error(`❌ Error in adaptive signal processing for ${selectedPair}:`, error);
      return this.processStandardSignal(candlestickData, selectedPair);
    }
  }

  async processStandardSignal(candlestickData: CandlestickData[], selectedPair: string): Promise<TradingSignal> {
    return this.standardProcessor.processStandardSignal(candlestickData, selectedPair);
  }
}
