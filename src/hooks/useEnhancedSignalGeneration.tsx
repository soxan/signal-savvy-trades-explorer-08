// Enhanced signal generation with all performance improvements
import { useState, useEffect, useCallback, useRef } from 'react';
import { TradingSignal, CandlestickData } from '@/lib/technicalAnalysis';
import { MarketData } from '@/lib/types/marketData';
import { useSignalPersistence } from './useSignalPersistence';
import { useSignalPerformanceTracking } from './useSignalPerformanceTracking';
import { signalCacheService } from '@/lib/services/SignalCacheService';
import { batchProcessorService } from '@/lib/services/BatchProcessorService';
import { circuitBreakerService } from '@/lib/services/CircuitBreakerService';
import { eventBus } from '@/lib/core/EventBus';

interface EnhancedSignalOptions {
  enableCaching?: boolean;
  enableBatching?: boolean;
  performanceTracking?: boolean;
  retryOnFailure?: boolean;
}

export function useEnhancedSignalGeneration(
  candlestickData: CandlestickData[] | undefined,
  selectedPair: string,
  marketData: MarketData[],
  options: EnhancedSignalOptions = {
    enableCaching: true,
    enableBatching: true,
    performanceTracking: true,
    retryOnFailure: true
  }
) {
  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signalPair, setSignalPair] = useState<string>('');
  const [cacheStats, setCacheStats] = useState<any>({});

  const { persistedSignals, saveSignal } = useSignalPersistence();
  const { trackSignalPerformance, getPerformanceMetrics } = useSignalPerformanceTracking();
  
  const processingRef = useRef<boolean>(false);
  const lastProcessedRef = useRef<{ pair: string; timestamp: number } | null>(null);
  const circuitBreaker = circuitBreakerService.getBreaker('signal_generation');

  // Clear signal when pair changes
  useEffect(() => {
    if (signalPair && signalPair !== selectedPair) {
      console.log(`🔄 ENHANCED: Pair changed ${signalPair} → ${selectedPair}`);
      setCurrentSignal(null);
      lastProcessedRef.current = null;
      
      // Invalidate cache for old pair
      if (options.enableCaching) {
        signalCacheService.invalidate(signalPair);
      }
    }
    setSignalPair(selectedPair);
  }, [selectedPair, signalPair, options.enableCaching]);

  const performanceMetrics = options.performanceTracking ? getPerformanceMetrics(selectedPair) : null;

  return {
    currentSignal: signalPair === selectedPair ? currentSignal : null,
    isProcessing,
    persistedSignals,
    performanceMetrics,
    cacheStats,
    signalHistory: persistedSignals.map(ps => ({
      signal: ps.signal,
      pair: ps.pair,
      timestamp: ps.timestamp
    }))
  };
}