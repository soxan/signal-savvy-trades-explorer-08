
import { useState, useEffect, useCallback, useRef } from 'react';
import { TradingSignal, CandlestickData } from '@/lib/technicalAnalysis';
import { optimizedSignalProcessor } from '@/lib/services/optimizedSignalProcessor';
import { systemHealthMonitor } from '@/lib/services/systemHealthMonitor';
import { useSignalPersistence } from './useSignalPersistence';

interface OptimizedSignalOptions {
  enhanced: boolean;
  healthMonitoring: boolean;
  cacheEnabled: boolean;
}

export function useOptimizedSignalGeneration(
  candlestickData: CandlestickData[] | undefined,
  selectedPair: string,
  options: OptimizedSignalOptions = {
    enhanced: true,
    healthMonitoring: true,
    cacheEnabled: true
  }
) {
  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'HEALTHY' | 'DEGRADED' | 'CRITICAL'>('HEALTHY');
  
  const { persistedSignals, saveSignal } = useSignalPersistence();
  const currentPairRef = useRef<string>(selectedPair);
  const processingRef = useRef<boolean>(false);

  // Initialize system health monitoring
  useEffect(() => {
    if (options.healthMonitoring) {
      systemHealthMonitor.startMonitoring();
    }
  }, [options.healthMonitoring]);

  // Clear signal when pair changes
  useEffect(() => {
    if (currentPairRef.current !== selectedPair) {
      console.log(`🔄 PAIR CHANGED: ${currentPairRef.current} → ${selectedPair}`);
      setCurrentSignal(null);
      currentPairRef.current = selectedPair;
    }
  }, [selectedPair]);

  // Monitor system health
  useEffect(() => {
    if (!options.healthMonitoring) return;

    const healthCheckInterval = setInterval(() => {
      const health = systemHealthMonitor.getOverallHealth();
      setSystemHealth(health.overall);
      
      if (health.overall === 'CRITICAL') {
        console.log('🚨 CRITICAL SYSTEM HEALTH - Resetting health monitor...');
        systemHealthMonitor.resetHealth();
        optimizedSignalProcessor.clearCache();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [options.healthMonitoring]);

  const processSignal = useCallback(async (
    candlestickData: CandlestickData[],
    selectedPair: string
  ) => {
    if (processingRef.current) {
      console.log('⏳ Processing in progress, skipping...');
      return;
    }

    if (systemHealth === 'CRITICAL') {
      console.log('🚨 System health critical, skipping signal processing');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const signal = await optimizedSignalProcessor.processSignal(
        candlestickData,
        selectedPair,
        options.enhanced
      );

      if (signal) {
        setCurrentSignal(signal);

        // Only save valid trading signals
        if (signal.type !== 'NEUTRAL' && signal.confidence > 0.05) {
          saveSignal(signal, selectedPair);
          console.log(`✅ OPTIMIZED SIGNAL: ${signal.type} for ${selectedPair} - Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
        } else {
          console.log(`ℹ️ Signal displayed but not saved: ${signal.type} for ${selectedPair}`);
        }
      }
    } catch (error) {
      console.error('❌ Error in optimized signal generation:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [options.enhanced, saveSignal, systemHealth]);

  // Main signal processing effect
  useEffect(() => {
    if (!candlestickData || candlestickData.length < 50) {
      console.log(`⚠️ Insufficient data for ${selectedPair}: ${candlestickData?.length || 0} candles`);
      return;
    }

    const delay = systemHealth === 'HEALTHY' ? 3000 : 5000; // Slower processing if unhealthy
    const timeoutId = setTimeout(() => {
      processSignal(candlestickData, selectedPair);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [candlestickData, selectedPair, processSignal, systemHealth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processingRef.current = false;
    };
  }, []);

  const signalHistory = persistedSignals.map(ps => ({
    signal: ps.signal,
    pair: ps.pair,
    timestamp: ps.timestamp
  }));

  return {
    currentSignal: currentPairRef.current === selectedPair ? currentSignal : null,
    isProcessing,
    systemHealth,
    signalHistory,
    persistedSignals,
    processingStats: optimizedSignalProcessor.getProcessingStats()
  };
}
