import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketDataService } from '@/lib/services/marketDataService';
import { MarketData } from '@/lib/types/marketData';

const tradingPairs = [
  'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT', 
  'XRP/USDT', 'DOGE/USDT', 'DOT/USDT', 'LINK/USDT', 'AVAX/USDT'
];

export function useTradingData(selectedPair: string, selectedTimeframe: string, autoRefresh: boolean) {
  const [lastMarketUpdate, setLastMarketUpdate] = useState<Date>(new Date());
  const [apiError, setApiError] = useState<string | null>(null);

  // Optimized market data fetching with better caching
  const { data: marketData, isLoading: isMarketLoading, error: marketError, refetch: refetchMarket } = useQuery({
    queryKey: ['optimizedMarketData', tradingPairs],
    queryFn: async () => {
      console.log('🔄 Fetching optimized market data...');
      setApiError(null);
      try {
        const data = await marketDataService.getEnhancedMarketData(tradingPairs);
        setLastMarketUpdate(new Date());
        console.log(`✅ Optimized market data updated: ${data.length} symbols`);
        
        // Log sample with volume quality
        if (data.length > 0) {
          const sample = data[0];
          console.log('📊 Optimized market data sample:', {
            symbol: sample.symbol,
            price: sample.price,
            change24h: sample.change24h,
            changePercent24h: sample.changePercent24h + '%',
            volume24h: sample.volume24h,
            volumeQuality: sample.additionalData?.volumeQuality || 'UNKNOWN',
            isVolumeRealistic: sample.additionalData?.isVolumeRealistic || false
          });
        }
        
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch optimized market data:', error);
        setApiError('Unable to connect to market data APIs. Please check your connection.');
        throw error;
      }
    },
    refetchInterval: autoRefresh ? 15000 : false, // Increased to 15 seconds for better performance
    staleTime: 12000, // 12 second stale time
    refetchOnWindowFocus: true,
    retry: 2, // Reduced retries
    retryDelay: 3000,
  });

  // Optimized candlestick data fetching
  const { data: candlestickData, error: candleError, refetch: refetchCandles } = useQuery({
    queryKey: ['optimizedCandlesticks', selectedPair, selectedTimeframe],
    queryFn: async () => {
      console.log(`🔄 Fetching optimized candlestick data for ${selectedPair} ${selectedTimeframe}`);
      try {
        const data = await marketDataService.getCandlestickData(selectedPair, selectedTimeframe, 200);
        console.log(`✅ Optimized candlestick data received: ${data.length} candles`);
        
        if (data.length > 0) {
          const latest = data[data.length - 1];
          const oldest = data[0];
          console.log('📈 Optimized candlestick data range:', {
            from: new Date(oldest.timestamp).toLocaleString(),
            to: new Date(latest.timestamp).toLocaleString(),
            latestPrice: latest.close.toFixed(2),
            volume: latest.volume.toFixed(0)
          });
        }
        
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch optimized candlestick data:', error);
        throw error;
      }
    },
    refetchInterval: autoRefresh ? 45000 : false, // Increased to 45 seconds
    staleTime: 30000, // 30 second stale time
    retry: 2,
    retryDelay: 5000,
  });

  // Memoized selected market data lookup
  const selectedMarketData = useCallback(() => {
    return marketData?.find(data => data.symbol === selectedPair);
  }, [marketData, selectedPair])();

  // Enhanced logging for selected market data
  if (selectedMarketData) {
    const volumeQuality = selectedMarketData.additionalData?.volumeQuality || 'UNKNOWN';
    console.log(`📊 Optimized selected market data for ${selectedPair}:`, {
      price: selectedMarketData.price.toFixed(2),
      change24h: selectedMarketData.change24h.toFixed(2),
      changePercent24h: selectedMarketData.changePercent24h.toFixed(2) + '%',
      volume24h: selectedMarketData.volume24h.toFixed(0),
      volumeQuality,
      high24h: selectedMarketData.high24h.toFixed(2),
      low24h: selectedMarketData.low24h.toFixed(2)
    });
  }

  return {
    marketData,
    candlestickData,
    selectedMarketData,
    isMarketLoading,
    lastMarketUpdate,
    apiError,
    marketError,
    candleError,
    refetchMarket,
    refetchCandles
  };
}
