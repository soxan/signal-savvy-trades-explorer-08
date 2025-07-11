// Batch processing for multiple trading pairs
import { TradingSignal, CandlestickData } from '../technicalAnalysis';
import { MarketData } from '../types/marketData';
import { eventBus } from '../core/EventBus';
import { SignalProcessor } from './signalProcessor';

interface BatchRequest {
  id: string;
  pair: string;
  candlestickData: CandlestickData[];
  marketData: MarketData[];
  timestamp: number;
  resolve: (signal: TradingSignal) => void;
  reject: (error: any) => void;
}

export class BatchProcessorService {
  private static instance: BatchProcessorService;
  private queue: BatchRequest[] = [];
  private processing = false;
  private batchSize = 3;
  private maxWaitTime = 2000; // 2 seconds
  private signalProcessor = new SignalProcessor();

  static getInstance(): BatchProcessorService {
    if (!BatchProcessorService.instance) {
      BatchProcessorService.instance = new BatchProcessorService();
    }
    return BatchProcessorService.instance;
  }

  async processSignal(
    pair: string,
    candlestickData: CandlestickData[],
    marketData: MarketData[]
  ): Promise<TradingSignal> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: `${pair}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pair,
        candlestickData,
        marketData,
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.queue.push(request);
      console.log(`📥 Queued signal processing for ${pair} (queue size: ${this.queue.length})`);

      // Trigger processing if conditions are met
      this.maybeProcessBatch();

      // Set timeout to process even if batch isn't full
      setTimeout(() => {
        if (this.queue.includes(request)) {
          this.maybeProcessBatch(true);
        }
      }, this.maxWaitTime);
    });
  }

  private async maybeProcessBatch(forceProcess = false): Promise<void> {
    if (this.processing) return;

    const shouldProcess = forceProcess || 
                         this.queue.length >= this.batchSize ||
                         (this.queue.length > 0 && this.isOldestRequestStale());

    if (!shouldProcess) return;

    this.processing = true;
    await this.processBatch();
    this.processing = false;

    // Process remaining items if any
    if (this.queue.length > 0) {
      setTimeout(() => this.maybeProcessBatch(), 100);
    }
  }

  private isOldestRequestStale(): boolean {
    if (this.queue.length === 0) return false;
    const oldest = this.queue[0];
    return Date.now() - oldest.timestamp > this.maxWaitTime;
  }

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    console.log(`🔄 Processing batch of ${batch.length} signal requests`);

    const startTime = Date.now();

    // Process all requests in parallel
    const promises = batch.map(async (request) => {
      try {
        const signal = await this.signalProcessor.processAdaptiveSignal(
          request.candlestickData,
          request.pair,
          request.marketData
        );
        
        request.resolve(signal);
        return { success: true, pair: request.pair };
      } catch (error) {
        console.error(`❌ Batch processing failed for ${request.pair}:`, error);
        request.reject(error);
        return { success: false, pair: request.pair, error };
      }
    });

    const results = await Promise.allSettled(promises);
    const processingTime = Date.now() - startTime;

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Batch processing complete: ${successful} success, ${failed} failed (${processingTime}ms)`);

    // Emit batch processing event
    eventBus.emit('batch:processed', {
      batchSize: batch.length,
      successful,
      failed,
      processingTime,
      pairs: batch.map(r => r.pair)
    });
  }

  // Configure batch processing
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(10, size)); // Between 1-10
    console.log(`📊 Batch size set to ${this.batchSize}`);
  }

  setMaxWaitTime(ms: number): void {
    this.maxWaitTime = Math.max(500, Math.min(10000, ms)); // Between 0.5-10 seconds
    console.log(`⏱️ Max wait time set to ${this.maxWaitTime}ms`);
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      batchSize: this.batchSize,
      maxWaitTime: this.maxWaitTime,
      oldestRequestAge: this.queue.length > 0 ? Date.now() - this.queue[0].timestamp : 0
    };
  }

  // Emergency clear queue
  clearQueue(): void {
    const cleared = this.queue.length;
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    console.log(`🗑️ Cleared ${cleared} pending signal requests`);
  }
}

export const batchProcessorService = BatchProcessorService.getInstance();