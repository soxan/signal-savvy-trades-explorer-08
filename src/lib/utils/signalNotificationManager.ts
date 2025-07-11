
import { TradingSignal } from '../technicalAnalysis';
import { QualityMetrics } from './signalQualityAnalyzer';

export class SignalNotificationManager {
  static sendNotification(
    signal: TradingSignal,
    selectedPair: string,
    qualityMetrics: QualityMetrics
  ) {
    if (signal.confidence >= 0.06 || qualityMetrics.qualityScore >= 40) {
      if ((window as any).addSystemNotification) {
        const severityLevel = signal.confidence >= 0.15 && qualityMetrics.qualityScore >= 60 ? 'HIGH' : 'MEDIUM';
        
        (window as any).addSystemNotification({
          type: 'SIGNAL',
          title: `🎯 ${signal.type} Signal Generated`,
          message: `${selectedPair}: ${signal.type} signal with ${(signal.confidence * 100).toFixed(1)}% confidence (Quality: ${qualityMetrics.qualityScore.toFixed(0)}). Entry: $${signal.entry.toFixed(6)}`,
          severity: severityLevel,
          data: { signal, pair: selectedPair, qualityMetrics }
        });
      }
    }
  }
}
