
import { TradingSignal, CandlestickData } from '../technicalAnalysis';
import { optimizedSignalProcessor } from './optimizedSignalProcessor';
import { pipeline } from '@huggingface/transformers';
import * as tf from '@tensorflow/tfjs';

interface MLPrediction {
  priceDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number;
  nextPriceRange: { min: number; max: number };
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';
  riskScore: number;
}

export interface MLEnhancedSignal extends TradingSignal {
  mlPrediction: MLPrediction;
  mlConfidence: number;
  hybridConfidence: number;
  adaptiveLeverage: number;
  mlRecommendation: string;
}

export class MLEnhancedSignalProcessor {
  private sentimentAnalyzer: any = null;
  private pricePredictor: tf.LayersModel | null = null;
  private isInitialized = false;
  private marketRegimeModel: tf.LayersModel | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing ML Enhanced Signal Processor...');
      
      // Initialize sentiment analysis for market news/social sentiment
      this.sentimentAnalyzer = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'webgpu' }
      );

      // Initialize TensorFlow.js models
      await this.initializePricePredictionModel();
      await this.initializeMarketRegimeModel();

      this.isInitialized = true;
      console.log('✅ ML System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ML system:', error);
      // Fallback to non-ML mode
      this.isInitialized = false;
    }
  }

  private async initializePricePredictionModel() {
    // Create a simple LSTM model for price prediction
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({ units: 50, returnSequences: true, inputShape: [20, 5] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 50, returnSequences: false }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 25 }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // UP, DOWN, SIDEWAYS
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.pricePredictor = model;
    console.log('📈 Price prediction model initialized');
  }

  private async initializeMarketRegimeModel() {
    // Create a model for market regime classification
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [10] }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 4, activation: 'softmax' }) // BULL, BEAR, SIDEWAYS, VOLATILE
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.marketRegimeModel = model;
    console.log('🎯 Market regime model initialized');
  }

  async processMLEnhancedSignal(
    candlestickData: CandlestickData[],
    selectedPair: string,
    enhanced: boolean = true
  ): Promise<MLEnhancedSignal | null> {
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🧠 Processing ML-ENHANCED signal for ${selectedPair}`);

      // Get base signal from existing system
      const baseSignal = await optimizedSignalProcessor.processSignal(
        candlestickData,
        selectedPair,
        enhanced
      );

      if (!baseSignal) return null;

      // Generate ML predictions
      const mlPrediction = await this.generateMLPrediction(candlestickData, selectedPair);
      
      // Combine traditional and ML signals
      const hybridSignal = this.combineSignals(baseSignal, mlPrediction);

      console.log(`🤖 ML Analysis for ${selectedPair}:`, {
        traditionalSignal: baseSignal.type,
        mlPrediction: mlPrediction.priceDirection,
        marketRegime: mlPrediction.marketRegime,
        hybridConfidence: (hybridSignal.hybridConfidence * 100).toFixed(1) + '%',
        adaptiveLeverage: hybridSignal.adaptiveLeverage
      });

      return hybridSignal;

    } catch (error) {
      console.error('❌ ML processing error:', error);
      // Fallback to base signal
      const baseSignal = await optimizedSignalProcessor.processSignal(
        candlestickData,
        selectedPair,
        enhanced
      );
      
      if (baseSignal) {
        return {
          ...baseSignal,
          mlPrediction: {
            priceDirection: 'SIDEWAYS',
            confidence: 0,
            nextPriceRange: { min: baseSignal.entry, max: baseSignal.entry },
            marketRegime: 'SIDEWAYS',
            riskScore: 0.5
          },
          mlConfidence: 0,
          hybridConfidence: baseSignal.confidence,
          adaptiveLeverage: baseSignal.leverage,
          mlRecommendation: 'ML unavailable, using traditional analysis'
        };
      }
      
      return null;
    }
  }

  private async generateMLPrediction(candlestickData: CandlestickData[], pair: string): Promise<MLPrediction> {
    const features = this.extractFeatures(candlestickData);
    
    // Price direction prediction using LSTM
    const priceDirection = await this.predictPriceDirection(features);
    
    // Market regime classification
    const marketRegime = await this.classifyMarketRegime(features);
    
    // Sentiment analysis (simulated for demo - would connect to news APIs)
    const sentimentScore = await this.analyzeSentiment(pair);
    
    // Risk assessment
    const riskScore = this.calculateMLRiskScore(features, marketRegime);

    const currentPrice = candlestickData[candlestickData.length - 1].close;
    const volatility = this.calculateVolatility(candlestickData);
    
    return {
      priceDirection: priceDirection.direction,
      confidence: priceDirection.confidence,
      nextPriceRange: {
        min: currentPrice * (1 - volatility * 2),
        max: currentPrice * (1 + volatility * 2)
      },
      marketRegime,
      riskScore: Math.min(Math.max(riskScore + sentimentScore, 0), 1)
    };
  }

  private extractFeatures(candlestickData: CandlestickData[]): number[][] {
    const recentData = candlestickData.slice(-20);
    
    return recentData.map(candle => [
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.volume
    ]);
  }

  private async predictPriceDirection(features: number[][]): Promise<{ direction: 'UP' | 'DOWN' | 'SIDEWAYS', confidence: number }> {
    if (!this.pricePredictor || features.length < 20) {
      return { direction: 'SIDEWAYS', confidence: 0.33 };
    }

    try {
      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(features);
      const tensorInput = tf.tensor3d([normalizedFeatures]);
      
      const prediction = this.pricePredictor.predict(tensorInput) as tf.Tensor;
      const probabilities = await prediction.data();
      
      tensorInput.dispose();
      prediction.dispose();

      const maxProb = Math.max(...probabilities);
      const maxIndex = Array.from(probabilities).indexOf(maxProb);
      
      const directions: ('UP' | 'DOWN' | 'SIDEWAYS')[] = ['UP', 'DOWN', 'SIDEWAYS'];
      
      return {
        direction: directions[maxIndex],
        confidence: maxProb
      };
    } catch (error) {
      console.error('Price prediction error:', error);
      return { direction: 'SIDEWAYS', confidence: 0.33 };
    }
  }

  private async classifyMarketRegime(features: number[][]): Promise<'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE'> {
    if (!this.marketRegimeModel || features.length < 10) {
      return 'SIDEWAYS';
    }

    try {
      // Extract regime features (trend, volatility, momentum indicators)
      const regimeFeatures = this.extractRegimeFeatures(features);
      const tensorInput = tf.tensor2d([regimeFeatures]);
      
      const prediction = this.marketRegimeModel.predict(tensorInput) as tf.Tensor;
      const probabilities = await prediction.data();
      
      tensorInput.dispose();
      prediction.dispose();

      const maxIndex = Array.from(probabilities).indexOf(Math.max(...probabilities));
      const regimes: ('BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE')[] = ['BULL', 'BEAR', 'SIDEWAYS', 'VOLATILE'];
      
      return regimes[maxIndex];
    } catch (error) {
      console.error('Market regime classification error:', error);
      return 'SIDEWAYS';
    }
  }

  private extractRegimeFeatures(features: number[][]): number[] {
    const closes = features.map(f => f[3]);
    const volumes = features.map(f => f[4]);
    
    // Calculate technical indicators for regime classification
    const sma20 = closes.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
    const sma50 = closes.slice(-50)?.reduce((sum, price) => sum + price, 0) / Math.min(50, closes.length) || sma20;
    const currentPrice = closes[closes.length - 1];
    
    const volatility = this.calculateVolatility(features.map(f => ({
      open: f[0], high: f[1], low: f[2], close: f[3], volume: f[4]
    })));
    
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    
    return [
      currentPrice / sma20, // Price relative to SMA20
      sma20 / sma50, // SMA trend
      volatility * 100, // Volatility percentage
      currentVolume / avgVolume, // Volume ratio
      this.calculateMomentum(closes),
      this.calculateRSI(closes),
      ...closes.slice(-4).map(price => price / currentPrice) // Recent price ratios
    ];
  }

  private async analyzeSentiment(pair: string): Promise<number> {
    if (!this.sentimentAnalyzer) return 0;

    try {
      // Simulate market sentiment analysis
      // In production, this would analyze real news/social media data
      const sampleTexts = [
        `${pair} shows strong bullish momentum`,
        `Market volatility affects ${pair} trading`,
        `Technical analysis suggests ${pair} uptrend`
      ];
      
      const sentiments = await Promise.all(
        sampleTexts.map(text => this.sentimentAnalyzer(text))
      );
      
      const avgSentiment = sentiments.reduce((sum, result) => {
        return sum + (result[0].label === 'POSITIVE' ? result[0].score : -result[0].score);
      }, 0) / sentiments.length;
      
      return avgSentiment * 0.1; // Scale to 0.1 impact
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return 0;
    }
  }

  private calculateMLRiskScore(features: number[][], marketRegime: string): number {
    const volatility = this.calculateVolatility(features.map(f => ({
      open: f[0], high: f[1], low: f[2], close: f[3], volume: f[4]
    })));
    
    let baseRisk = volatility * 2; // Higher volatility = higher risk
    
    // Adjust risk based on market regime
    switch (marketRegime) {
      case 'VOLATILE':
        baseRisk *= 1.5;
        break;
      case 'BEAR':
        baseRisk *= 1.3;
        break;
      case 'BULL':
        baseRisk *= 0.8;
        break;
      case 'SIDEWAYS':
        baseRisk *= 1.1;
        break;
    }
    
    return Math.min(Math.max(baseRisk, 0.1), 0.9);
  }

  private combineSignals(baseSignal: TradingSignal, mlPrediction: MLPrediction): MLEnhancedSignal {
    // ML-Traditional signal agreement scoring
    const agreementScore = this.calculateAgreementScore(baseSignal, mlPrediction);
    
    // Hybrid confidence calculation
    const hybridConfidence = (baseSignal.confidence * 0.6) + (mlPrediction.confidence * 0.4);
    
    // Adaptive leverage based on ML risk assessment
    const adaptiveLeverage = this.calculateAdaptiveLeverage(
      baseSignal.leverage,
      mlPrediction.riskScore,
      mlPrediction.marketRegime,
      agreementScore
    );

    // Enhanced entry/exit points using ML insights
    const enhancedSignal = this.enhanceEntryExit(baseSignal, mlPrediction);

    return {
      ...enhancedSignal,
      mlPrediction,
      mlConfidence: mlPrediction.confidence,
      hybridConfidence: Math.min(hybridConfidence + (agreementScore * 0.1), 0.95),
      adaptiveLeverage,
      mlRecommendation: this.generateMLRecommendation(baseSignal, mlPrediction, agreementScore)
    };
  }

  private calculateAgreementScore(baseSignal: TradingSignal, mlPrediction: MLPrediction): number {
    const signalDirection = baseSignal.type;
    const mlDirection = mlPrediction.priceDirection;
    
    if ((signalDirection === 'BUY' && mlDirection === 'UP') ||
        (signalDirection === 'SELL' && mlDirection === 'DOWN')) {
      return 1.0; // Perfect agreement
    } else if (signalDirection === 'NEUTRAL' || mlDirection === 'SIDEWAYS') {
      return 0.5; // Neutral agreement
    } else {
      return 0.0; // Disagreement
    }
  }

  private calculateAdaptiveLeverage(
    baseLeverage: number,
    riskScore: number,
    marketRegime: string,
    agreementScore: number
  ): number {
    let adaptiveLeverage = baseLeverage;
    
    // Reduce leverage for high risk
    if (riskScore > 0.7) {
      adaptiveLeverage *= 0.7;
    } else if (riskScore > 0.5) {
      adaptiveLeverage *= 0.85;
    }
    
    // Adjust for market regime
    switch (marketRegime) {
      case 'VOLATILE':
        adaptiveLeverage *= 0.6;
        break;
      case 'BEAR':
        adaptiveLeverage *= 0.8;
        break;
      case 'BULL':
        adaptiveLeverage *= Math.min(1.1, 1.0 + agreementScore * 0.1);
        break;
    }
    
    // Boost leverage for high agreement
    if (agreementScore > 0.8) {
      adaptiveLeverage *= 1.05;
    }
    
    return Math.max(Math.min(Math.round(adaptiveLeverage), 25), 10);
  }

  private enhanceEntryExit(baseSignal: TradingSignal, mlPrediction: MLPrediction): TradingSignal {
    const currentPrice = baseSignal.entry;
    const priceRange = mlPrediction.nextPriceRange;
    
    // Adjust entry point based on ML prediction
    let enhancedEntry = baseSignal.entry;
    if (baseSignal.type === 'BUY' && priceRange.min < currentPrice) {
      enhancedEntry = (currentPrice + priceRange.min) / 2; // Better entry point
    } else if (baseSignal.type === 'SELL' && priceRange.max > currentPrice) {
      enhancedEntry = (currentPrice + priceRange.max) / 2;
    }
    
    // Enhanced stop loss using ML risk assessment
    const riskMultiplier = 1 + mlPrediction.riskScore;
    const slDistance = Math.abs(baseSignal.entry - baseSignal.stopLoss) * riskMultiplier;
    const enhancedStopLoss = baseSignal.type === 'BUY' ?
      enhancedEntry - slDistance :
      enhancedEntry + slDistance;
    
    // Enhanced take profit using ML price range
    const tpMultiplier = 2 - mlPrediction.riskScore; // Lower risk = higher TP
    const tpDistance = Math.abs(baseSignal.takeProfit - baseSignal.entry) * tpMultiplier;
    const enhancedTakeProfit = baseSignal.type === 'BUY' ?
      enhancedEntry + tpDistance :
      enhancedEntry - tpDistance;

    return {
      ...baseSignal,
      entry: enhancedEntry,
      stopLoss: enhancedStopLoss,
      takeProfit: enhancedTakeProfit,
      riskReward: Math.abs(enhancedTakeProfit - enhancedEntry) / Math.abs(enhancedEntry - enhancedStopLoss)
    };
  }

  private generateMLRecommendation(
    baseSignal: TradingSignal,
    mlPrediction: MLPrediction,
    agreementScore: number
  ): string {
    const confidence = mlPrediction.confidence;
    const regime = mlPrediction.marketRegime;
    
    if (agreementScore > 0.8 && confidence > 0.7) {
      return `🎯 HIGH CONFIDENCE: ML and technical analysis agree (${regime} market)`;
    } else if (agreementScore < 0.3) {
      return `⚠️ CONFLICTING SIGNALS: Exercise caution in ${regime} market`;
    } else if (regime === 'VOLATILE') {
      return `🌊 VOLATILE MARKET: Reduced position size recommended`;
    } else if (regime === 'BULL' && baseSignal.type === 'BUY') {
      return `🚀 BULL MARKET ALIGNMENT: Favorable conditions for long positions`;
    } else if (regime === 'BEAR' && baseSignal.type === 'SELL') {
      return `🐻 BEAR MARKET ALIGNMENT: Favorable conditions for short positions`;
    } else {
      return `📊 STANDARD SIGNAL: ML confidence ${(confidence * 100).toFixed(1)}%`;
    }
  }

  // Utility methods
  private normalizeFeatures(features: number[][]): number[][] {
    const transposed = features[0].map((_, colIndex) => features.map(row => row[colIndex]));
    
    return features.map(row => 
      row.map((value, index) => {
        const column = transposed[index];
        const min = Math.min(...column);
        const max = Math.max(...column);
        return max > min ? (value - min) / (max - min) : 0;
      })
    );
  }

  private calculateVolatility(candlestickData: { close: number }[]): number {
    const returns = candlestickData.slice(1).map((candle, i) =>
      (candle.close - candlestickData[i].close) / candlestickData[i].close
    );
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 2) return 0;
    return (prices[prices.length - 1] - prices[0]) / prices[0];
  }

  private calculateRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }

  // Public utility methods
  getMLStats() {
    return {
      initialized: this.isInitialized,
      hasSentimentAnalysis: !!this.sentimentAnalyzer,
      hasPricePredictor: !!this.pricePredictor,
      hasMarketRegimeModel: !!this.marketRegimeModel
    };
  }

  clearCache() {
    console.log('🧹 Clearing ML processor cache...');
    // Add any ML-specific cache clearing here
  }
}

export const mlEnhancedSignalProcessor = new MLEnhancedSignalProcessor();
