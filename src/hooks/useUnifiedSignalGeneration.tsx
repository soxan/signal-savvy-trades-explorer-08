import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TradingSignal, CandlestickData } from '@/lib/technicalAnalysis';
import { useSignalPersistence } from './useSignalPersistence';
import { useSignalPerformanceTracking } from './useSignalPerformanceTracking';
import { SignalProcessor } from '@/lib/services/signalProcessor';
import { systemHealthMonitor } from '@/lib/services/systemHealthMonitor';
import { signalCoordinator } from '@/lib/services/signalCoordinator';
import { signalValidator } from '@/lib/services/signalValidator';
import { MarketData } from '@/lib/types/marketData';

interface UnifiedSignalOptions {
  enhanced: boolean;
  fastProcessing?: boolean;
  performanceTracking?: boolean;
  marketAdaptive?: boolean;
}

export function useUnifiedSignalGeneration(
  candlestickData: CandlestickData[] | undefined, 
  selectedPair: string,
  marketData: MarketData[],
  options: UnifiedSignalOptions = { enhanced: true, fastProcessing: true, performanceTracking: true, marketAdaptive: true }
) {
  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signalPair, setSignalPair] = useState<string>('');
  
  const { persistedSignals, saveSignal } = useSignalPersistence();
  const { trackSignalPerformance, getPerformanceMetrics } = useSignalPerformanceTracking();
  
  const processingRef = useRef<boolean>(false);
  const lastProcessedRef = useRef<{ pair: string; timestamp: number } | null>(null);
  const signalProcessor = useMemo(() => new SignalProcessor(), []);

  // Initialize system monitoring
  useEffect(() => {
    systemHealthMonitor.startMonitoring();
  }, []);

  // Clear signal when pair changes
  useEffect(() => {
    if (signalPair && signalPair !== selectedPair) {
      console.log(`🔄 PAIR CHANGED: ${signalPair} → ${selectedPair}, clearing signal`);
      setCurrentSignal(null);
      lastProcessedRef.current = null;
    }
    setSignalPair(selectedPair);
  }, [selectedPair, signalPair]);

  const processSignal = useCallback(async (candlestickData: CandlestickData[], selectedPair: string) => {
    if (processingRef.current) {
      console.log('⏳ Signal processing in progress, skipping...');
      return;
    }

    // Increased cooldown to 10 minutes for better duplicate prevention
    const lastProcessed = lastProcessedRef.current;
    if (lastProcessed && 
        lastProcessed.pair === selectedPair && 
        (Date.now() - lastProcessed.timestamp) < 600000) {
      console.log(`⏸️ Recently processed ${selectedPair} within 10 minutes, blocking`);
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      console.log(`🚀 Processing UNIFIED signal for ${selectedPair}`);
      
      let processedSignal: TradingSignal;
      
      if (options.marketAdaptive && options.enhanced) {
        processedSignal = await signalProcessor.processAdaptiveSignal(
          candlestickData,
          selectedPair,
          marketData
        );
      } else {
        processedSignal = await signalProcessor.processStandardSignal(candlestickData, selectedPair);
      }
      
      if (!processedSignal) {
        console.log(`⚠️ No signal generated for ${selectedPair}`);
        return;
      }
      
      // Validate signal first
      if (!signalValidator.validateSignal(processedSignal, selectedPair)) {
        console.log(`❌ Signal validation failed for ${selectedPair}`);
        return;
      }
      
      // Process through coordinator
      const coordinatorResult = await signalCoordinator.processSignal(processedSignal, selectedPair);
      
      if (coordinatorResult) {
        // Always update display
        setCurrentSignal(coordinatorResult.signal);
        setSignalPair(selectedPair);
        
        // Save signal if recommended
        if (coordinatorResult.shouldSave) {
          saveSignal(coordinatorResult.signal, selectedPair);
          console.log(`💾 Signal saved for ${selectedPair}: ${coordinatorResult.processingReason}`);
        } else {
          console.log(`📋 Signal displayed only for ${selectedPair}: ${coordinatorResult.processingReason}`);
        }
        
        // Track performance if recommended
        if (coordinatorResult.shouldTrack && options.performanceTracking) {
          trackSignalPerformance(coordinatorResult.signal, selectedPair);
          console.log(`📊 Signal tracked for performance: ${selectedPair}`);
        }
        
        console.log(`✅ UNIFIED SIGNAL COMPLETE for ${selectedPair}:`, {
          type: coordinatorResult.signal.type,
          confidence: (coordinatorResult.signal.confidence * 100).toFixed(2) + '%',
          patterns: coordinatorResult.signal.patterns.length,
          reason: coordinatorResult.processingReason,
          saving: coordinatorResult.shouldSave
        });
      } else {
        console.log(`❌ Signal rejected by coordinator for ${selectedPair}`);
      }
      
      // Update processing reference
      lastProcessedRef.current = {
        pair: selectedPair,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('❌ Error in unified signal generation:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [signalProcessor, saveSignal, trackSignalPerformance, options, marketData]);

  useEffect(() => {
    if (candlestickData && candlestickData.length > 20 && marketData && marketData.length > 0) {
      // Increased delay to 8 seconds to reduce frequency
      const delay = options.fastProcessing ? 8000 : 12000;
      const timeoutId = setTimeout(() => {
        processSignal(candlestickData, selectedPair);
      }, delay);

      return () => clearTimeout(timeoutId);
    } else {
      console.log(`⚠️ Insufficient data for ${selectedPair}: ${candlestickData?.length || 0} candles, ${marketData?.length || 0} market pairs`);
    }
  }, [candlestickData, selectedPair, marketData, processSignal, options.fastProcessing]);

  // Cleanup interval - clear old references every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastProcessedRef.current && (Date.now() - lastProcessedRef.current.timestamp) > 900000) {
        lastProcessedRef.current = null;
        console.log('🧹 Cleared old processing reference');
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const performanceMetrics = options.performanceTracking ? getPerformanceMetrics(selectedPair) : null;

  return {
    currentSignal: signalPair === selectedPair ? currentSignal : null,
    isProcessing,
    persistedSignals,
    performanceMetrics,
    signalHistory: persistedSignals.map(ps => ({
      signal: ps.signal,
      pair: ps.pair,
      timestamp: ps.timestamp
    }))
  };
}
