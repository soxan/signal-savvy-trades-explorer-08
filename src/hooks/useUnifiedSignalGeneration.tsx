
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

    // More lenient cooldown
    const lastProcessed = lastProcessedRef.current;
    if (lastProcessed && 
        lastProcessed.pair === selectedPair && 
        (Date.now() - lastProcessed.timestamp) < 2000) { // Reduced to 2 seconds
      console.log(`⏸️ Recently processed ${selectedPair}, waiting...`);
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
      
      // Fallback signal
      const fallbackSignal: TradingSignal = {
        type: 'NEUTRAL',
        confidence: 0.05,
        patterns: ['Error Recovery'],
        entry: candlestickData[candlestickData.length - 1].close,
        stopLoss: candlestickData[candlestickData.length - 1].close * 0.99,
        takeProfit: candlestickData[candlestickData.length - 1].close * 1.01,
        riskReward: 1.0,
        leverage: 1,
        positionSize: 1.0,
        tradingFees: 0.1,
        netProfit: 0,
        netLoss: 0
      };
      setCurrentSignal(fallbackSignal);
      setSignalPair(selectedPair);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [signalProcessor, saveSignal, trackSignalPerformance, options, marketData]);

  useEffect(() => {
    if (candlestickData && candlestickData.length > 20 && marketData && marketData.length > 0) {
      const delay = options.fastProcessing ? 2500 : 3500; // Slightly faster
      const timeoutId = setTimeout(() => {
        processSignal(candlestickData, selectedPair);
      }, delay);

      return () => clearTimeout(timeoutId);
    } else {
      console.log(`⚠️ Insufficient data for ${selectedPair}: ${candlestickData?.length || 0} candles, ${marketData?.length || 0} market pairs`);
    }
  }, [candlestickData, selectedPair, marketData, processSignal, options.fastProcessing]);

  // Cleanup interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastProcessedRef.current && (Date.now() - lastProcessedRef.current.timestamp) > 300000) { // 5 minutes
        lastProcessedRef.current = null;
        console.log('🧹 Cleared old processing reference');
      }
    }, 60000); // Check every minute

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
