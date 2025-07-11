
import { useState, useEffect, useCallback, useRef } from 'react';
import { CandlestickData } from '@/lib/technicalAnalysis';
import { highLeveragePatternML, HighLeverageAnalysis } from '@/lib/services/highLeveragePatternML';
import { useSignalPersistence } from './useSignalPersistence';

export function useHighLeverageTrading(
  candlestickData: CandlestickData[] | undefined,
  selectedPair: string
) {
  const [analysis, setAnalysis] = useState<HighLeverageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedPair, setLastAnalyzedPair] = useState<string>('');
  
  const { saveSignal } = useSignalPersistence();
  const processingRef = useRef<boolean>(false);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear analysis when pair changes
  useEffect(() => {
    if (lastAnalyzedPair !== selectedPair) {
      console.log(`🔄 Pair changed from ${lastAnalyzedPair} to ${selectedPair}, clearing analysis`);
      setAnalysis(null);
      setLastAnalyzedPair(selectedPair);
    }
  }, [selectedPair, lastAnalyzedPair]);

  const performHighLeverageAnalysis = useCallback(async (
    data: CandlestickData[],
    pair: string
  ) => {
    if (processingRef.current) {
      console.log('⏳ High-leverage analysis in progress, skipping...');
      return;
    }

    processingRef.current = true;
    setIsAnalyzing(true);

    try {
      console.log(`🎯 Starting high-leverage analysis for ${pair}`);
      
      const analysisResult = await highLeveragePatternML.analyzeForHighLeverage(data, pair);
      
      setAnalysis(analysisResult);
      setLastAnalyzedPair(pair);

      // Log detailed results
      if (analysisResult.signal) {
        console.log(`🚀 HIGH-LEVERAGE SIGNAL GENERATED for ${pair}:`, {
          pattern: analysisResult.signal.patternSignal?.patternName,
          hybridConfidence: (analysisResult.signal.hybridConfidence * 100).toFixed(1) + '%',
          optimalLeverage: analysisResult.signal.optimalLeverage + 'x',
          quickProfitPotential: (analysisResult.signal.quickProfitPotential * 100).toFixed(2) + '%',
          entryTiming: analysisResult.signal.entryTiming,
          marketSuitability: analysisResult.marketSuitability,
          liquidationRisk: (analysisResult.liquidationRisk * 100).toFixed(1) + '%',
          expectedProfitTime: analysisResult.expectedProfitTime + ' minutes'
        });

        // Save high-quality signals
        if (analysisResult.signal.entryTiming === 'IMMEDIATE' && 
            analysisResult.signal.hybridConfidence > 0.7 &&
            analysisResult.signal.patternSignal) {
          
          const tradingSignal = {
            type: analysisResult.signal.patternSignal.type,
            confidence: analysisResult.signal.hybridConfidence,
            patterns: [`${analysisResult.signal.patternSignal.patternName} (ML-Enhanced)`],
            entry: analysisResult.signal.patternSignal.entry,
            stopLoss: analysisResult.signal.exitStrategy.stopLoss,
            takeProfit: analysisResult.signal.exitStrategy.quickTakeProfit,
            riskReward: analysisResult.signal.patternSignal.riskReward,
            leverage: analysisResult.signal.optimalLeverage,
            positionSize: analysisResult.signal.patternSignal.positionSize,
            tradingFees: 0.1,
            netProfit: 0,
            netLoss: 0
          };

          saveSignal(tradingSignal, pair);
          console.log(`💾 Saved high-leverage signal for ${pair}`);
        }
      } else {
        console.log(`📊 No suitable high-leverage opportunities for ${pair}:`, {
          marketSuitability: analysisResult.marketSuitability,
          volatilityScore: (analysisResult.volatilityScore * 100).toFixed(2) + '%'
        });
      }
    } catch (error) {
      console.error('❌ Error in high-leverage analysis:', error);
      setAnalysis({
        signal: null,
        marketSuitability: 'POOR',
        volatilityScore: 0,
        liquidationRisk: 0,
        expectedProfitTime: 0,
        confidence: 0
      });
    } finally {
      processingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [saveSignal]);

  // Main analysis effect with proper timing for high-leverage trading
  useEffect(() => {
    if (!candlestickData || candlestickData.length < 100) {
      console.log(`⚠️ Insufficient data for high-leverage analysis: ${candlestickData?.length || 0} candles`);
      return;
    }

    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Quick analysis for high-leverage opportunities
    analysisTimeoutRef.current = setTimeout(() => {
      performHighLeverageAnalysis(candlestickData, selectedPair);
    }, 3000); // Faster response for quick profit opportunities

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [candlestickData, selectedPair, performHighLeverageAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const refreshAnalysis = useCallback(() => {
    if (candlestickData && candlestickData.length >= 100) {
      performHighLeverageAnalysis(candlestickData, selectedPair);
    }
  }, [candlestickData, selectedPair, performHighLeverageAnalysis]);

  // Get current analysis for the selected pair
  const currentAnalysis = lastAnalyzedPair === selectedPair ? analysis : null;

  return {
    analysis: currentAnalysis,
    isAnalyzing,
    refreshAnalysis,
    hasSignal: currentAnalysis?.signal !== null,
    marketSuitability: currentAnalysis?.marketSuitability || 'POOR',
    quickProfitPotential: currentAnalysis?.signal?.quickProfitPotential || 0,
    liquidationRisk: currentAnalysis?.liquidationRisk || 0
  };
}
