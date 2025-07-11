
import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketData } from '@/lib/types/marketData';
import { useToast } from '@/hooks/use-toast';

export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'ABOVE' | 'BELOW';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}

const STORAGE_KEY = 'crypto_price_alerts';
const STORAGE_VERSION = '1.0';
const STORAGE_VERSION_KEY = 'crypto_price_alerts_version';

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isLoadingRef = useRef(false);

  // Improved localStorage operations with error handling and versioning
  const loadAlertsFromStorage = useCallback(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const version = localStorage.getItem(STORAGE_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored && version === STORAGE_VERSION) {
        const parsedAlerts = JSON.parse(stored) as PriceAlert[];
        // Validate the structure of loaded alerts
        const validAlerts = parsedAlerts.filter(alert => 
          alert.id && alert.symbol && alert.type && 
          typeof alert.targetPrice === 'number' && 
          typeof alert.isActive === 'boolean'
        );
        
        setAlerts(validAlerts);
        console.log(`📚 Loaded ${validAlerts.length} valid price alerts from localStorage`);
      } else if (version !== STORAGE_VERSION) {
        // Clear old version data
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_VERSION_KEY);
        console.log('🔄 Cleared old version price alerts data');
      }
    } catch (error) {
      console.error('❌ Failed to load price alerts:', error);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_VERSION_KEY);
    } finally {
      setIsLoaded(true);
      isLoadingRef.current = false;
    }
  }, []);

  // Debounced save function to prevent excessive writes
  const saveAlertsToStorage = useCallback((alertsToSave: PriceAlert[]) => {
    if (!isLoaded) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alertsToSave));
        localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
        console.log(`💾 Saved ${alertsToSave.length} price alerts to localStorage`);
      } catch (error) {
        console.error('❌ Failed to save price alerts:', error);
        toast({
          title: "Storage Error",
          description: "Failed to save price alerts. Storage may be full.",
          variant: "destructive",
        });
      }
    }, 500); // 500ms debounce
  }, [isLoaded, toast]);

  // Load alerts on mount
  useEffect(() => {
    loadAlertsFromStorage();
  }, [loadAlertsFromStorage]);

  // Save alerts whenever they change (with debouncing)
  useEffect(() => {
    if (isLoaded && alerts.length >= 0) {
      saveAlertsToStorage(alerts);
    }
  }, [alerts, isLoaded, saveAlertsToStorage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const addAlert = useCallback((symbol: string, type: 'ABOVE' | 'BELOW', targetPrice: number, currentPrice: number) => {
    // Check for duplicate alerts with more precise matching
    const existingAlert = alerts.find(alert => 
      alert.symbol === symbol && 
      alert.type === type && 
      Math.abs(alert.targetPrice - targetPrice) < 0.001 &&
      alert.isActive
    );

    if (existingAlert) {
      toast({
        title: "Duplicate Alert",
        description: `A similar alert for ${symbol} already exists`,
        variant: "destructive",
      });
      return false;
    }

    const newAlert: PriceAlert = {
      id: `${symbol}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      type,
      targetPrice,
      currentPrice,
      isActive: true,
      createdAt: Date.now()
    };

    setAlerts(prev => {
      const updated = [...prev, newAlert];
      console.log(`✅ Added ${type} alert for ${symbol} at $${targetPrice.toLocaleString()}`);
      return updated;
    });
    
    toast({
      title: "🔔 Price Alert Created",
      description: `Alert set: ${symbol} ${type.toLowerCase()} $${targetPrice.toLocaleString()}`,
    });
    
    return true;
  }, [alerts, toast]);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => {
      const updated = prev.filter(alert => alert.id !== alertId);
      console.log(`🗑️ Removed alert with ID: ${alertId}`);
      return updated;
    });
    
    toast({
      title: "Alert Removed",
      description: "Price alert has been deleted",
    });
  }, [toast]);

  const checkAlerts = useCallback((marketData: MarketData[]) => {
    if (!isLoaded || alerts.length === 0) return;

    const currentTime = Date.now();
    let hasTriggeredAlerts = false;
    
    setAlerts(prevAlerts => {
      return prevAlerts.map(alert => {
        if (!alert.isActive) return alert;

        const market = marketData.find(m => m.symbol === alert.symbol);
        if (!market) return alert;

        const shouldTrigger = 
          (alert.type === 'ABOVE' && market.price >= alert.targetPrice) ||
          (alert.type === 'BELOW' && market.price <= alert.targetPrice);

        if (shouldTrigger) {
          hasTriggeredAlerts = true;
          
          // Trigger alert notification
          toast({
            title: "🚨 Price Alert Triggered!",
            description: `${alert.symbol} is now ${alert.type.toLowerCase()} $${alert.targetPrice.toLocaleString()} (Current: $${market.price.toLocaleString()})`,
            variant: "default",
          });

          console.log(`🚨 PRICE ALERT TRIGGERED: ${alert.symbol} ${alert.type} $${alert.targetPrice} (Current: $${market.price})`);

          return {
            ...alert,
            isActive: false,
            triggeredAt: currentTime,
            currentPrice: market.price
          };
        }

        return alert;
      });
    });
  }, [isLoaded, alerts, toast]);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    // Also clear localStorage immediately
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_VERSION_KEY);
    } catch (error) {
      console.error('❌ Failed to clear alerts from localStorage:', error);
    }
    
    toast({
      title: "All Alerts Cleared",
      description: "All price alerts have been removed",
    });
  }, [toast]);

  const getActiveAlerts = useCallback(() => alerts.filter(alert => alert.isActive), [alerts]);
  const getTriggeredAlerts = useCallback(() => alerts.filter(alert => !alert.isActive && alert.triggeredAt), [alerts]);

  return {
    alerts,
    activeAlerts: getActiveAlerts(),
    triggeredAlerts: getTriggeredAlerts(),
    addAlert,
    removeAlert,
    checkAlerts,
    clearAllAlerts,
    isLoaded
  };
}
