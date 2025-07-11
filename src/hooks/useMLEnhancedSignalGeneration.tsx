
import { useState, useEffect, useCallback, useRef } from 'react';
import { CandlestickData } from '@/lib/technicalAnalysis';
import { mlEnhancedSignalProcessor, MLEnhancedSignal } from '@/lib/services/mlEnhancedSignalProcessor';
import { useSignalPersistence } from './useSignalPersistence';

interface MLSignalOptions {
  enhanced: boolean;
  mlEnabled: boolean;
  autoInitialize: boolean;
}

export function useMLEnhancedSignalGeneration(
  candlestickData: CandlestickData[] | undefined,
  selectedPair: string,
  options: MLSignalOptions = {
    enhanced: true,
    mlEnabled: true,
    autoInitialize: true
  }
) {
  const [currentSignal, setCurrentSignal] = useState<MLEnhancedSignal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mlInitialized, setMLInitialized] = useState(false);
  const [mlStats, setMLStats] = useState({
    initialized: false,
    hasSentimentAnalysis: false,
    hasPricePredictor: false,
    hasMarketRegimeModel: false
  });

  const { persistedSignals, saveSignal } = useSignalPersistence();
  const processingRef = useRef<boolean>(false);
  const currentPairRef = useRef<string>(selectedPair);

  // Initialize ML system
  useEffect(() => {
    if (options.mlEnabled && options.autoInitialize && !mlInitialized) {
      initializeML();
    }
  }, [options.mlEnabled, options.autoInitialize, mlInitialized]);

  // Clear signal when pair changes
  useEffect(() => {
    if (currentPairRef.current !== selectedPair) {
      console.log(`🔄 PAIR CHANGED: ${currentPairRef.current} → ${selectedPair}`);
      setCurrentSignal(null);
      currentPairRef.current = selectedPair;
    }
  }, [selectedPair]);

  const initializeML = async () => {
    try {
      setIsProcessing(true);
      console.log('🤖 Initializing ML Enhanced Signal Generation...');
      
      await mlEnhancedSignalProcessor.initialize();
      
      setMLInitialized(true);
      setMLStats(mlEnhancedSignalProcessor.getMLStats());
      
      console.log('✅ ML system ready for enhanced signal generation');
    } catch (error) {
      console.error('❌ Failed to initialize ML system:', error);
      setMLInitialized(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const processMLSignal = useCallback(async (
    candlestickData: CandlestickData[],
    selectedPair: string
  ) => {
    if (processingRef.current) {
      console.log('⏳ ML processing in progress, skipping...');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      console.log(`🧠 Processing ML-enhanced signal for ${selectedPair}`);
      
      const mlSignal = await mlEnhancedSignalProcessor.processMLEnhancedSignal(
        candlestickData,
        selectedPair,
        options.enhanced
      );

      if (mlSignal) {
        setCurrentSignal(mlSignal);

        // Save enhanced signals with higher thresholds
        if (mlSignal.type !== 'NEUTRAL' && mlSignal.hybridConfidence > 0.1) {
          // Convert MLEnhancedSignal to TradingSignal for persistence
          const signalForPersistence = {
            type: mlSignal.type,
            confidence: mlSignal.hybridConfidence,
            patterns: [...mlSignal.patterns, `ML:${mlSignal.mlPrediction.marketRegime}`],
            entry: mlSignal.entry,
            stopLoss: mlSignal.stopLoss,
            takeProfit: mlSignal.takeProfit,
            riskReward: mlSignal.riskReward,
            leverage: mlSignal.adaptiveLeverage,
            positionSize: mlSignal.positionSize,
            tradingFees: mlSignal.tradingFees,
            netProfit: mlSignal.netProfit,
            netLoss: mlSignal.netLoss
          };

          saveSignal(signalForPersistence, selectedPair);
          
          console.log(`🎯 ML-ENHANCED SIGNAL: ${mlSignal.type} for ${selectedPair}`, {
            hybridConfidence: (mlSignal.hybridConfidence * 100).toFixed(1) + '%',
            mlConfidence: (mlSignal.mlConfidence * 100).toFixed(1) + '%',
            marketRegime: mlSignal.mlPrediction.marketRegime,
            adaptiveLeverage: mlSignal.adaptiveLeverage,
            recommendation: mlSignal.mlRecommendation
          });
        } else {
          console.log(`ℹ️ ML signal displayed but not saved: ${mlSignal.type} for ${selectedPair}`);
        }
      }
    } catch (error) {
      console.error('❌ Error in ML-enhanced signal generation:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [options.enhanced, saveSignal]);

  // Main signal processing effect
  useEffect(() => {
    if (!candlestickData || candlestickData.length < 50) {
      console.log(`⚠️ Insufficient data for ML processing: ${candlestickData?.length || 0} candles`);
      return;
    }

    if (!options.mlEnabled) {
      console.log('📊 ML disabled, skipping enhanced processing');
      return;
    }

    const delay = mlInitialized ? 4000 : 6000; // Longer delay for ML processing
    const timeoutId = setTimeout(() => {
      processMLSignal(candlestickData, selectedPair);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [candlestickData, selectedPair, processMLSignal, options.mlEnabled, mlInitialized]);

  // Update ML stats periodically
  useEffect(() => {
    if (mlInitialized) {
      const interval = setInterval(() => {
        setMLStats(mlEnhancedSignalProcessor.getMLStats());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [mlInitialized]);

  const signalHistory = persistedSignals.map(ps => ({
    signal: ps.signal,
    pair: ps.pair,
    timestamp: ps.timestamp
  }));

  return {
    currentSignal: currentPairRef.current === selectedPair ? currentSignal : null,
    isProcessing,
    mlInitialized,
    mlStats,
    signalHistory,
    persistedSignals,
    initializeML,
    clearMLCache: () => mlEnhancedSignalProcessor.clearCache()
  };
}
