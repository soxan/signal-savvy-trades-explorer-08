
import { TechnicalAnalysis, CandlestickData, TradingSignal } from '../../technicalAnalysis';
import { multiTimeframeAnalysis } from '../multiTimeframeAnalysis';
import { marketStructureAnalysis } from '../marketStructureAnalysis';
import { volumeAnalysis } from '../volumeAnalysis';
import { riskManagement } from '../riskManagement';
import { marketTrendAnalyzer } from '../marketTrendAnalyzer';
import { VolumeValidator } from '../../utils/volumeValidator';
import { SignalQualityAnalyzer } from '../../utils/signalQualityAnalyzer';
import { MarketData } from '@/lib/types/marketData';

export class AdaptiveSignalProcessor {
  private ta = new TechnicalAnalysis();

  async processAdaptiveSignal(
    candlestickData: CandlestickData[], 
    selectedPair: string, 
    marketData: MarketData[]
  ): Promise<TradingSignal> {
    console.log(`🚀 Processing ADAPTIVE signal for ${selectedPair} with market trend analysis`);
    
    try {
      // Analyze overall market trend
      const marketTrend = marketTrendAnalyzer.analyzeMarketTrend(marketData);
      const adaptiveConfig = marketTrendAnalyzer.getAdaptiveSignalConfig(marketTrend);
      
      // Multi-timeframe analysis
      const mtfAnalysis = await multiTimeframeAnalysis.analyzeMultipleTimeframes(selectedPair);
      
      // Market structure analysis
      const structureAnalysis = marketStructureAnalysis.analyzeMarketStructure(candlestickData);
      
      // Volume analysis
      const volumeAnalysisResult = volumeAnalysis.analyzeVolume(candlestickData);
      
      // Calculate technical indicators
      const indicators = this.calculateIndicators(candlestickData);
      
      // Generate base signal
      let signal = this.ta.generateEnhancedSignal(candlestickData, indicators, selectedPair);
      
      // Apply market trend adaptations
      signal = this.applyMarketTrendAdaptation(signal, marketTrend, adaptiveConfig, selectedPair);
      
      // Enhanced quality scoring with trend consideration
      const volumeValidation = VolumeValidator.validateVolume(
        candlestickData[candlestickData.length - 1].volume, 
        selectedPair
      );
      
      const qualityMetrics = SignalQualityAnalyzer.analyze(signal, indicators, candlestickData, volumeValidation);
      
      // Calculate confluence score with trend bias
      const confluenceScore = this.calculateAdaptiveConfluenceScore(
        signal, 
        mtfAnalysis, 
        structureAnalysis, 
        volumeAnalysisResult,
        marketTrend
      );
      
      // Risk management with trend consideration
      const riskMetrics = riskManagement.calculateEnhancedRisk(signal, candlestickData);
      
      // Final adaptive signal
      const adaptiveSignal = {
        ...signal,
        confidence: Math.min(
          Math.max(signal.confidence + adaptiveConfig.confidenceBoost, confluenceScore / 100, qualityMetrics.qualityScore / 100),
          0.95
        ),
        marketTrend: marketTrend.overallTrend,
        trendStrength: marketTrend.trendStrength
      };
      
      console.log(`✅ ADAPTIVE SIGNAL PROCESSED for ${selectedPair}:`, {
        type: adaptiveSignal.type,
        confidence: (adaptiveSignal.confidence * 100).toFixed(2) + '%',
        marketTrend: marketTrend.overallTrend,
        trendStrength: marketTrend.trendStrength.toFixed(1) + '%',
        recommendedBias: marketTrend.recommendedBias,
        confluenceScore: confluenceScore.toFixed(1),
        patterns: adaptiveSignal.patterns.length
      });
      
      return adaptiveSignal;
    } catch (error) {
      console.error(`❌ Error in adaptive signal processing for ${selectedPair}:`, error);
      throw error;
    }
  }

  private applyMarketTrendAdaptation(
    signal: TradingSignal,
    marketTrend: any,
    adaptiveConfig: any,
    selectedPair: string
  ): TradingSignal {
    let adaptedSignal = { ...signal };
    
    // Apply signal type bias based on market trend
    if (marketTrend.recommendedBias === 'BUY_BIAS' && signal.type === 'SELL') {
      if (signal.confidence < 0.7) {
        adaptedSignal.type = signal.confidence < 0.4 ? 'BUY' : 'NEUTRAL';
        adaptedSignal.patterns.push('Market Trend Override');
        console.log(`🔄 Converted SELL to ${adaptedSignal.type} due to ${marketTrend.overallTrend} market`);
      }
    } else if (marketTrend.recommendedBias === 'SELL_BIAS' && signal.type === 'BUY') {
      if (signal.confidence < 0.7) {
        adaptedSignal.type = signal.confidence < 0.4 ? 'SELL' : 'NEUTRAL';
        adaptedSignal.patterns.push('Market Trend Override');
        console.log(`🔄 Converted BUY to ${adaptedSignal.type} due to ${marketTrend.overallTrend} market`);
      }
    }
    
    // Adjust confidence based on trend alignment
    if ((adaptedSignal.type === 'BUY' && marketTrend.recommendedBias === 'BUY_BIAS') ||
        (adaptedSignal.type === 'SELL' && marketTrend.recommendedBias === 'SELL_BIAS')) {
      adaptedSignal.confidence = Math.min(adaptedSignal.confidence * 1.3, 0.95);
    }
    
    // Adjust position sizing based on trend strength and risk
    const trendMultiplier = marketTrend.trendStrength / 100;
    if (marketTrend.riskLevel === 'LOW' && marketTrend.trendStrength > 70) {
      adaptedSignal.positionSize = Math.min(adaptedSignal.positionSize * 1.5, 5.0);
      adaptedSignal.leverage = Math.min(adaptedSignal.leverage * 1.2, 50);
    } else if (marketTrend.riskLevel === 'HIGH') {
      adaptedSignal.positionSize = Math.max(adaptedSignal.positionSize * 0.7, 0.5);
      adaptedSignal.leverage = Math.max(adaptedSignal.leverage * 0.8, 5);
    }
    
    return adaptedSignal;
  }

  private calculateAdaptiveConfluenceScore(
    signal: TradingSignal,
    mtfAnalysis: any,
    structureAnalysis: any,
    volumeAnalysisResult: any,
    marketTrend: any
  ): number {
    let confluenceScore = 0;
    
    // Market trend alignment (40% weight)
    if ((signal.type === 'BUY' && marketTrend.recommendedBias === 'BUY_BIAS') ||
        (signal.type === 'SELL' && marketTrend.recommendedBias === 'SELL_BIAS')) {
      confluenceScore += 40 * (marketTrend.confidence / 100);
    } else if (signal.type === 'NEUTRAL') {
      confluenceScore += 20;
    } else {
      confluenceScore += 10;
    }
    
    // Multi-timeframe confluence (25% weight)
    confluenceScore += (mtfAnalysis?.confluence || 15) * 0.25;
    
    // Structure alignment (20% weight)
    if ((signal.type === 'BUY' && structureAnalysis?.trend === 'UPTREND') ||
        (signal.type === 'SELL' && structureAnalysis?.trend === 'DOWNTREND')) {
      confluenceScore += 20;
    } else if (signal.type !== 'NEUTRAL') {
      confluenceScore += 8;
    }
    
    // Volume confirmation (15% weight)
    if (volumeAnalysisResult?.volumeQuality === 'EXCELLENT') {
      confluenceScore += 15;
    } else if (volumeAnalysisResult?.volumeQuality === 'GOOD') {
      confluenceScore += 12;
    } else if (volumeAnalysisResult?.volumeQuality === 'AVERAGE') {
      confluenceScore += 8;
    } else {
      confluenceScore += 3;
    }
    
    return Math.min(confluenceScore, 100);
  }

  private calculateIndicators(candlestickData: CandlestickData[]) {
    const closes = candlestickData.map(d => d.close);
    const highs = candlestickData.map(d => d.high);
    const lows = candlestickData.map(d => d.low);
    const volumes = candlestickData.map(d => d.volume);

    return {
      rsi: this.ta.calculateRSI(closes, 14),
      macd: this.ta.calculateMACD(closes),
      sma: this.ta.calculateSMA(closes, 20),
      ema: this.ta.calculateEMA(closes, 12),
      bollingerBands: this.ta.calculateBollingerBands(closes),
      stochastic: this.ta.calculateStochastic(highs, lows, closes),
      williams: this.ta.calculateWilliamsR(highs, lows, closes),
      atr: this.ta.calculateATR(highs, lows, closes),
      vwap: this.ta.calculateVWAP(highs, lows, closes, volumes),
      adx: this.ta.calculateADX(highs, lows, closes),
      cci: this.ta.calculateCCI(highs, lows, closes)
    };
  }
}
