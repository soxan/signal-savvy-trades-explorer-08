// Centralized state management using Zustand pattern
import { eventBus } from './EventBus';
import { TradingSignal, CandlestickData } from '../technicalAnalysis';
import { MarketData } from '../types/marketData';

interface TradingState {
  // Core trading data
  selectedPair: string;
  selectedTimeframe: string;
  autoRefresh: boolean;
  
  // Market data
  marketData: MarketData[];
  candlestickData: CandlestickData[] | undefined;
  selectedMarketData: MarketData | undefined;
  isMarketLoading: boolean;
  lastMarketUpdate: Date;
  
  // Signals
  currentSignal: TradingSignal | null;
  signalHistory: Array<{ signal: TradingSignal; pair: string; timestamp: number }>;
  persistedSignals: any[];
  isProcessing: boolean;
  
  // UI state
  activeTab: string;
  sidebarOpen: boolean;
  showNotifications: boolean;
  notificationCount: number;
  
  // Errors
  apiError: string | null;
  marketError: any;
  candleError: any;
}

class TradingStateManager {
  private static instance: TradingStateManager;
  private state: TradingState;
  private subscribers = new Set<(state: TradingState) => void>();

  constructor() {
    this.state = {
      selectedPair: 'BTC/USDT',
      selectedTimeframe: '1h',
      autoRefresh: true,
      marketData: [],
      candlestickData: undefined,
      selectedMarketData: undefined,
      isMarketLoading: false,
      lastMarketUpdate: new Date(),
      currentSignal: null,
      signalHistory: [],
      persistedSignals: [],
      isProcessing: false,
      activeTab: 'trading',
      sidebarOpen: false,
      showNotifications: false,
      notificationCount: 0,
      apiError: null,
      marketError: null,
      candleError: null,
    };
  }

  static getInstance(): TradingStateManager {
    if (!TradingStateManager.instance) {
      TradingStateManager.instance = new TradingStateManager();
    }
    return TradingStateManager.instance;
  }

  getState(): TradingState {
    return { ...this.state };
  }

  setState(updates: Partial<TradingState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Emit events for specific state changes
    if (updates.selectedPair && updates.selectedPair !== previousState.selectedPair) {
      eventBus.emit('pair:changed', { 
        pair: updates.selectedPair, 
        previousPair: previousState.selectedPair 
      });
    }
    
    if (updates.selectedTimeframe && updates.selectedTimeframe !== previousState.selectedTimeframe) {
      eventBus.emit('timeframe:changed', { 
        timeframe: updates.selectedTimeframe, 
        previousTimeframe: previousState.selectedTimeframe 
      });
    }

    if (updates.currentSignal && updates.currentSignal !== previousState.currentSignal) {
      eventBus.emit('signal:updated', { 
        signal: updates.currentSignal, 
        pair: this.state.selectedPair 
      });
    }

    if (updates.marketData && updates.marketData !== previousState.marketData) {
      eventBus.emit('market:data:updated', { 
        data: updates.marketData, 
        timestamp: Date.now() 
      });
    }
    
    // Notify subscribers
    this.notifySubscribers();
  }

  subscribe(callback: (state: TradingState) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  // Computed properties
  getSelectedMarketData(): MarketData | undefined {
    return this.state.marketData.find(data => data.symbol === this.state.selectedPair);
  }

  getActiveSignalCount(): number {
    return this.state.signalHistory.filter(s => s.signal.type !== 'NEUTRAL').length;
  }

  // Utility methods
  reset(): void {
    const defaultState: TradingState = {
      selectedPair: 'BTC/USDT',
      selectedTimeframe: '1h',
      autoRefresh: true,
      marketData: [],
      candlestickData: undefined,
      selectedMarketData: undefined,
      isMarketLoading: false,
      lastMarketUpdate: new Date(),
      currentSignal: null,
      signalHistory: [],
      persistedSignals: [],
      isProcessing: false,
      activeTab: 'trading',
      sidebarOpen: false,
      showNotifications: false,
      notificationCount: 0,
      apiError: null,
      marketError: null,
      candleError: null,
    };
    
    this.state = defaultState;
    this.notifySubscribers();
  }
}

export const tradingStateManager = TradingStateManager.getInstance();
export type { TradingState };