
import { useState, useEffect, useCallback, useRef } from 'react';
import { TradingSignal, CandlestickData } from '@/lib/technicalAnalysis';
import { activeSignalGenerator } from '@/lib/services/activeSignalGenerator';
import { useSignalPersistence } from './useSignalPersistence';

export function useActiveSignalGeneration(
  candlestickData: CandlestickData[] | undefined,
  selectedPair: string
) {
  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signalCount, setSignalCount] = useState(0);
  
  const { persistedSignals, saveSignal } = useSignalPersistence();
  const processingRef = useRef<boolean>(false);
  const lastPairRef = useRef<string>('');

  // Clear signal when pair changes
  useEffect(() => {
    if (lastPairRef.current && lastPairRef.current !== selectedPair) {
      console.log(`🔄 Pair changed: ${lastPairRef.current} → ${selectedPair}`);
      setCurrentSignal(null);
      setSignalCount(0);
    }
    lastPairRef.current = selectedPair;
  }, [selectedPair]);

  const processSignal = useCallback(async (
    candlestickData: CandlestickData[],
    selectedPair: string
  ) => {
    if (processingRef.current) {
      console.log('⏳ Already processing signal...');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      console.log(`🔄 Generating active signal for ${selectedPair}`);
      
      const signal = activeSignalGenerator.generateActiveSignal(candlestickData, selectedPair);
      
      if (signal) {
        setCurrentSignal(signal);
        setSignalCount(prev => prev + 1);
        
        // Save actionable signals
        if (signal.type !== 'NEUTRAL' && signal.confidence > 0.4) {
          saveSignal(signal, selectedPair);
          console.log(`✅ ACTIVE SIGNAL SAVED: ${signal.type} for ${selectedPair} - ${(signal.confidence * 100).toFixed(1)}%`);
        } else {
          console.log(`ℹ️ Signal generated but not saved: ${signal.type} - ${(signal.confidence * 100).toFixed(1)}%`);
        }
      } else {
        console.log(`⚠️ No signal generated for ${selectedPair}`);
      }
    } catch (error) {
      console.error('❌ Error in active signal generation:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [saveSignal]);

  // Process signals with faster intervals
  useEffect(() => {
    if (!candlestickData || candlestickData.length < 20) {
      console.log(`⚠️ Insufficient data for ${selectedPair}: ${candlestickData?.length || 0} candles`);
      return;
    }

    const delay = 2000; // 2 seconds
    const timeoutId = setTimeout(() => {
      processSignal(candlestickData, selectedPair);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [candlestickData, selectedPair, processSignal]);

  const signalHistory = persistedSignals.map(ps => ({
    signal: ps.signal,
    pair: ps.pair,
    timestamp: ps.timestamp
  }));

  return {
    currentSignal: lastPairRef.current === selectedPair ? currentSignal : null,
    isProcessing,
    signalCount,
    signalHistory,
    persistedSignals
  };
}
