
import { useState, useEffect } from 'react';
import { TradingSignal } from '@/lib/technicalAnalysis';

export interface PersistedSignal {
  signal: TradingSignal;
  pair: string;
  timestamp: number;
  id: string;
  status: 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'EXPIRED';
  outcome?: 'WIN' | 'LOSS';
  exitPrice?: number;
  pnl?: number;
  entryTime: number;
}

const STORAGE_KEY = 'trading_signals_history';
const MAX_STORED_SIGNALS = 500;

export function useSignalPersistence() {
  const [persistedSignals, setPersistedSignals] = useState<PersistedSignal[]>([]);

  // Load signals from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const signals = JSON.parse(stored) as PersistedSignal[];
        setPersistedSignals(signals);
        console.log(`📚 Loaded ${signals.length} persisted signals from localStorage`);
      }
    } catch (error) {
      console.error('❌ Error loading signals from localStorage:', error);
    }
  }, []);

  // Save signals to localStorage whenever persistedSignals changes
  useEffect(() => {
    try {
      if (persistedSignals.length > 0) {
        const trimmedSignals = persistedSignals.slice(-MAX_STORED_SIGNALS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSignals));
        console.log(`💾 Saved ${trimmedSignals.length} signals to localStorage`);
      }
    } catch (error) {
      console.error('❌ Error saving signals to localStorage:', error);
    }
  }, [persistedSignals]);

  const saveSignal = (signal: TradingSignal, pair: string) => {
    // Save ALL signals for comprehensive analysis
    const newPersistedSignal: PersistedSignal = {
      signal,
      pair,
      timestamp: Date.now(),
      id: `${pair}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: signal.type === 'NEUTRAL' ? 'EXPIRED' : 'ACTIVE',
      entryTime: Date.now()
    };

    setPersistedSignals(prev => {
      const updated = [...prev, newPersistedSignal];
      console.log(`✅ Saved ${signal.type} signal for ${pair} (confidence: ${(signal.confidence * 100).toFixed(2)}%)`);
      return updated;
    });
  };

  const updateSignalStatus = (id: string, status: PersistedSignal['status'], outcome?: 'WIN' | 'LOSS', exitPrice?: number, pnl?: number) => {
    setPersistedSignals(prev => 
      prev.map(signal => 
        signal.id === id 
          ? { ...signal, status, outcome, exitPrice, pnl }
          : signal
      )
    );
  };

  const clearAllSignals = () => {
    setPersistedSignals([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared all persisted signals');
  };

  return {
    persistedSignals,
    saveSignal,
    updateSignalStatus,
    clearAllSignals
  };
}
