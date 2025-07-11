// Modern hook using new architecture with state management
import { useEffect, useState } from 'react';
import { tradingStateManager, TradingState } from '@/lib/core/TradingStateManager';
import { tradingDataService } from '@/lib/services/TradingDataService';
import { eventBus } from '@/lib/core/EventBus';
import { useQuery } from '@tanstack/react-query';

const tradingPairs = [
  'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT', 
  'XRP/USDT', 'DOGE/USDT', 'DOT/USDT', 'LINK/USDT', 'AVAX/USDT'
];

export function useTradingStore() {
  const [state, setState] = useState<TradingState>(tradingStateManager.getState());

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = tradingStateManager.subscribe(setState);
    return unsubscribe;
  }, []);

  // Market data query with new service
  const { data: marketData, isLoading: isMarketLoading, error: marketError, refetch: refetchMarket } = useQuery({
    queryKey: ['enhanced_market_data', tradingPairs],
    queryFn: () => tradingDataService.getMarketData(tradingPairs),
    refetchInterval: state.autoRefresh ? 15000 : false,
    staleTime: 12000,
    retry: 2,
    retryDelay: 3000,
  });

  // Handle market data updates
  useEffect(() => {
    if (marketData) {
      tradingStateManager.setState({ 
        marketData: marketData, 
        lastMarketUpdate: new Date(),
        apiError: null 
      });
    }
  }, [marketData]);

  useEffect(() => {
    if (marketError) {
      tradingStateManager.setState({ 
        apiError: 'Unable to connect to market data APIs. Please check your connection.',
        marketError: marketError 
      });
    }
  }, [marketError]);

  // Candlestick data query with new service
  const { data: candlestickData, error: candleError, refetch: refetchCandles } = useQuery({
    queryKey: ['enhanced_candlesticks', state.selectedPair, state.selectedTimeframe],
    queryFn: () => tradingDataService.getCandlestickData(state.selectedPair, state.selectedTimeframe, 200),
    refetchInterval: state.autoRefresh ? 45000 : false,
    staleTime: 30000,
    retry: 2,
    retryDelay: 5000,
  });

  // Handle candlestick data updates
  useEffect(() => {
    if (candlestickData) {
      tradingStateManager.setState({ candlestickData: candlestickData });
    }
  }, [candlestickData]);

  useEffect(() => {
    if (candleError) {
      tradingStateManager.setState({ candleError: candleError });
    }
  }, [candleError]);

  // Update loading state
  useEffect(() => {
    tradingStateManager.setState({ isMarketLoading });
  }, [isMarketLoading]);

  // Event-driven updates
  useEffect(() => {
    const unsubscribePairChange = eventBus.subscribe('pair:changed', ({ pair }) => {
      console.log(`🔄 Pair changed to ${pair}, clearing cache`);
      tradingDataService.clearCache(`candles_${pair}`);
    });

    const unsubscribeTimeframeChange = eventBus.subscribe('timeframe:changed', ({ timeframe }) => {
      console.log(`🔄 Timeframe changed to ${timeframe}, clearing cache`);
      tradingDataService.clearCache(`candles_`);
    });

    return () => {
      unsubscribePairChange();
      unsubscribeTimeframeChange();
    };
  }, []);

  // Actions
  const actions = {
    setSelectedPair: (pair: string) => {
      tradingStateManager.setState({ selectedPair: pair });
    },
    setSelectedTimeframe: (timeframe: string) => {
      tradingStateManager.setState({ selectedTimeframe: timeframe });
    },
    setAutoRefresh: (autoRefresh: boolean) => {
      tradingStateManager.setState({ autoRefresh });
    },
    setActiveTab: (tab: string) => {
      tradingStateManager.setState({ activeTab: tab });
    },
    setSidebarOpen: (open: boolean) => {
      tradingStateManager.setState({ sidebarOpen: open });
    },
    setShowNotifications: (show: boolean) => {
      tradingStateManager.setState({ showNotifications: show });
    },
    setNotificationCount: (count: number) => {
      tradingStateManager.setState({ notificationCount: count });
    },
    refetchData: () => {
      refetchMarket();
      refetchCandles();
    },
    clearCache: (pattern?: string) => {
      tradingDataService.clearCache(pattern);
    }
  };

  // Computed values
  const selectedMarketData = tradingStateManager.getSelectedMarketData();
  const activeSignalCount = tradingStateManager.getActiveSignalCount();

  return {
    // State
    ...state,
    selectedMarketData,
    
    // Computed
    activeSignalCount,
    
    // Loading states
    isMarketLoading,
    
    // Errors
    marketError,
    candleError,
    
    // Actions
    ...actions,
    
    // Legacy support
    refetchMarket,
    refetchCandles,
    
    // Cache stats for debugging
    cacheStats: tradingDataService.getCacheStats()
  };
}