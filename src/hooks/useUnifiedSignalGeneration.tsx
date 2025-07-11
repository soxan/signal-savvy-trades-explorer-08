
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TradingSignal, CandlestickData } from '@/lib/technicalAnalysis';
import { useSignalPersistence } from './useSignalPersistence';
import { useSignalPerformanceTracking } from './useSignalPerformanceTracking';
import { SignalProcessor } from '@/lib/services/signalProcessor';
import { systemHealthMonitor } from '@/lib/services/systemHealthMonitor';
import { signalCoordinator } from '@/lib/services/signalCoordinator';
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
      console.log('⏳ Signal processing in progress, allowing concurrent processing for market adaptiveness...');
    }

    // Market-adaptive cooldown
    const lastProcessed = lastProcessedRef.current;
    if (lastProcessed && 
        lastProcessed.pair === selectedPair && 
        (Date.now() - lastProcessed.timestamp) < 3000) { // 3 second cooldown for stability
      console.log(`⏸️ Recently processed ${selectedPair}, waiting for market-adaptive timing...`);
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      console.log(`🚀 Processing MARKET-ADAPTIVE ${options.enhanced ? 'ENHANCED' : 'STANDARD'} signal for ${selectedPair}`);
      
      let processedSignal: TradingSignal;
      
      if (options.marketAdaptive && options.enhanced) {
        // Use new adaptive signal processing
        processedSignal = await signalProcessor.processAdaptiveSignal(
          candlestickData,
          selectedPair,
          marketData
        );
      } else {
        // Fallback to standard processing
        processedSignal = await signalProcessor.processStandardSignal(candlestickData, selectedPair);
      }
      
      if (!processedSignal) {
        console.log(`⚠️ No signal generated for ${selectedPair}`);
        return;
      }
      
      // Use signal coordinator for validation and processing
      const coordinatorResult = await signalCoordinator.processSignal(processedSignal, selectedPair);
      
      if (coordinatorResult) {
        // Always update display
        setCurrentSignal(coordinatorResult.signal);
        setSignalPair(selectedPair);
        
        // Save signal based on coordinator recommendation
        if (coordinatorResult.shouldSave) {
          saveSignal(coordinatorResult.signal, selectedPair);
          console.log(`💾 Signal saved for ${selectedPair} (${coordinatorResult.processingReason})`);
        }
        
        // Track performance if recommended
        if (coordinatorResult.shouldTrack && options.performanceTracking) {
          trackSignalPerformance(coordinatorResult.signal, selectedPair);
          console.log(`📊 Signal tracked for performance analysis: ${selectedPair}`);
        }
        
        console.log(`✅ MARKET-ADAPTIVE SIGNAL COMPLETE for ${selectedPair}:`, {
          type: coordinatorResult.signal.type,
          confidence: (coordinatorResult.signal.confidence * 100).toFixed(2) + '%',
          marketTrend: (coordinatorResult.signal as any).marketTrend || 'N/A',
          trendStrength: ((coordinatorResult.signal as any).trendStrength || 0).toFixed(1) + '%',
          reason: coordinatorResult.processingReason
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
      console.error('❌ Error in market-adaptive signal generation:', error);
      
      // Enhanced fallback with market context
      const fallbackSignal: TradingSignal = {
        type: 'NEUTRAL',
        confidence: 0.2,
        patterns: ['Error Recovery'],
        entry: candlestickData[candlestickData.length - 1].close,
        stopLoss: candlestickData[candlestickData.length - 1].close * 0.99,
        takeProfit: candlestickData[candlestickData.length - 1].close * 1.01,
        riskReward: 1.0,
        leverage: 10,
        positionSize: 1.0,
        tradingFees: 10,
        netProfit: 100,
        netLoss: 100
      };
      setCurrentSignal(fallbackSignal);
      setSignalPair(selectedPair);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [signalProcessor, saveSignal, trackSignalPerformance, options, marketData]);

  useEffect(() => {
    // Fixed: Add proper undefined checks before accessing .length
    if (candlestickData && candlestickData.length > 25 && marketData && marketData.length > 0) {
      const delay = options.fastProcessing ? 1500 : 2500; // Slightly slower for stability
      const timeoutId = setTimeout(() => {
        processSignal(candlestickData, selectedPair);
      }, delay);

      return () => clearTimeout(timeoutId);
    } else {
      console.log(`⚠️ Insufficient data for ${selectedPair}: ${candlestickData?.length || 0} candles, ${marketData?.length || 0} market pairs`);
    }
  }, [candlestickData, selectedPair, marketData, processSignal, options.fastProcessing]);

  // Enhanced cleanup and monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Clear old processing references
      if (lastProcessedRef.current && (Date.now() - lastProcessedRef.current.timestamp) > 120000) { // 2 minutes
        lastProcessedRef.current = null;
        console.log('🧹 Cleared old processing reference for market adaptiveness');
      }
      
      // System health monitoring
      const health = systemHealthMonitor.getOverallHealth();
      if (health.overall === 'CRITICAL') {
        console.log('🚨 System health critical - maintaining market-adaptive processing');
      }
    }, 15000); // Check every 15 seconds

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
