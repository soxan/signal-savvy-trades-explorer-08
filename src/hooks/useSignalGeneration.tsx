
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TechnicalAnalysis, CandlestickData, TradingSignal } from '@/lib/technicalAnalysis';
import { useSignalPersistence } from './useSignalPersistence';
import { VolumeValidator } from '@/lib/utils/volumeValidator';
import { MarketThresholds } from '@/lib/utils/marketThresholds';
import { SignalQualityAnalyzer } from '@/lib/utils/signalQualityAnalyzer';
import { signalDuplicateDetector } from '@/lib/utils/signalDuplicateDetector';
import { SignalNotificationManager } from '@/lib/utils/signalNotificationManager';

export function useSignalGeneration(candlestickData: CandlestickData[] | undefined, selectedPair: string) {
  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [lastSignalsByPair, setLastSignalsByPair] = useState<Map<string, {signal: TradingSignal, timestamp: number}>>(new Map());
  
  const { persistedSignals, saveSignal } = useSignalPersistence();
  
  const ta = useMemo(() => new TechnicalAnalysis(), []);
  const processingRef = useRef<boolean>(false);

  // Debounced signal processing
  const processSignal = useCallback(async (candlestickData: CandlestickData[], selectedPair: string) => {
    if (processingRef.current) {
      console.log('⏳ Signal processing already in progress, skipping...');
      return;
    }

    processingRef.current = true;
    
    try {
      console.log(`🔄 Processing signal for ${selectedPair} with ${candlestickData.length} candles`);
      
      const closes = candlestickData.map(d => d.close);
      const highs = candlestickData.map(d => d.high);
      const lows = candlestickData.map(d => d.low);
      const volumes = candlestickData.map(d => d.volume);

      const indicators = {
        rsi: ta.calculateRSI(closes, 14),
        macd: ta.calculateMACD(closes),
        sma: ta.calculateSMA(closes, 20),
        ema: ta.calculateEMA(closes, 12),
        bollingerBands: ta.calculateBollingerBands(closes),
        stochastic: ta.calculateStochastic(highs, lows, closes),
        williams: ta.calculateWilliamsR(highs, lows, closes),
        atr: ta.calculateATR(highs, lows, closes),
        vwap: ta.calculateVWAP(highs, lows, closes, volumes),
        adx: ta.calculateADX(highs, lows, closes),
        cci: ta.calculateCCI(highs, lows, closes)
      };

      const signal = ta.generateSignal(candlestickData, indicators);
      
      // Enhanced volume validation
      const volumeValidation = VolumeValidator.validateVolume(
        candlestickData[candlestickData.length - 1].volume, 
        selectedPair
      );
      
      // Enhanced signal quality analysis
      const qualityMetrics = SignalQualityAnalyzer.analyze(signal, indicators, candlestickData, volumeValidation);
      
      console.log(`🎯 OPTIMIZED Signal Analysis for ${selectedPair}:`, {
        type: signal.type,
        confidence: (signal.confidence * 100).toFixed(1) + '%',
        patterns: signal.patterns.length,
        qualityScore: qualityMetrics.qualityScore.toFixed(1),
        marketCondition: qualityMetrics.marketCondition,
        volumeRealistic: volumeValidation.isRealistic,
        volumeHigh: volumeValidation.isHigh
      });
      
      if (signalDuplicateDetector.recordSignal(signal, selectedPair)) {
        setCurrentSignal(signal);

        // Market-specific thresholds
        const thresholds = MarketThresholds.getThresholds(
          selectedPair, 
          qualityMetrics.marketCondition, 
          qualityMetrics.momentum || 0, 
          volumeValidation
        );
        
        // Improved acceptance criteria
        const shouldAcceptSignal = (
          signal.type !== 'NEUTRAL' && 
          (signal.confidence >= thresholds.confidence || qualityMetrics.qualityScore >= thresholds.quality + 10) && 
          qualityMetrics.qualityScore >= thresholds.quality
        );
        
        if (shouldAcceptSignal) {
          saveSignal(signal, selectedPair);
          
          setLastSignalsByPair(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(selectedPair, { signal, timestamp: Date.now() });
            return newMap;
          });
          
          console.log(`✅ OPTIMIZED SIGNAL ACCEPTED! ${signal.type} for ${selectedPair}:`, {
            confidence: (signal.confidence * 100).toFixed(1) + '%',
            qualityScore: qualityMetrics.qualityScore.toFixed(1),
            thresholds: {
              confidence: (thresholds.confidence * 100).toFixed(1) + '%',
              quality: thresholds.quality
            }
          });
          
          // Enhanced notification
          SignalNotificationManager.sendNotification(signal, selectedPair, qualityMetrics);
        } else {
          console.log(`❌ Signal rejected for ${selectedPair}:`, {
            type: signal.type,
            confidence: (signal.confidence * 100).toFixed(1) + '%',
            qualityScore: qualityMetrics.qualityScore.toFixed(1),
            thresholds: {
              confidence: (thresholds.confidence * 100).toFixed(1) + '%',
              quality: thresholds.quality
            },
            reason: signal.type === 'NEUTRAL' ? 'Neutral signal' : 'Below acceptance thresholds'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in optimized signal generation:', error);
      setCurrentSignal({
        type: 'NEUTRAL',
        confidence: 0,
        patterns: [],
        entry: candlestickData[candlestickData.length - 1].close,
        stopLoss: candlestickData[candlestickData.length - 1].close,
        takeProfit: candlestickData[candlestickData.length - 1].close,
        riskReward: 0,
        leverage: 20,
        positionSize: 0,
        tradingFees: 0,
        netProfit: 0,
        netLoss: 0
      });
    } finally {
      processingRef.current = false;
    }
  }, [ta, saveSignal]);

  // Optimized effect with debouncing
  useEffect(() => {
    if (candlestickData && candlestickData.length > 50) {
      const timeoutId = setTimeout(() => {
        processSignal(candlestickData, selectedPair);
      }, 2000);

      return () => clearTimeout(timeoutId);
    } else {
      console.log(`⚠️ Insufficient data for ${selectedPair}: ${candlestickData?.length || 0} candles (need >50)`);
    }
  }, [candlestickData, selectedPair, processSignal]);

  // Clear cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      signalDuplicateDetector.clearCache();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const signalHistory = persistedSignals.map(ps => ({
    signal: ps.signal,
    pair: ps.pair,
    timestamp: ps.timestamp
  }));

  return {
    currentSignal,
    signalHistory,
    persistedSignals
  };
}
