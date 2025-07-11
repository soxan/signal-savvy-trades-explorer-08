// Event-driven architecture for real-time updates
export type EventCallback<T = any> = (data: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners = new Map<string, EventCallback[]>();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit<T>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  unsubscribe(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  getEventCount(): number {
    return this.listeners.size;
  }

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }
}

// Event types for type safety
export interface TradingEvents {
  'signal:generated': { signal: any; pair: string; timestamp: number };
  'signal:updated': { signal: any; pair: string };
  'market:data:updated': { data: any[]; timestamp: number };
  'pair:changed': { pair: string; previousPair: string };
  'timeframe:changed': { timeframe: string; previousTimeframe: string };
  'system:health:critical': { component: string; issue: string };
  'notification:new': { type: string; message: string; timestamp: number };
  'cache:invalidated': { key: string; reason: string };
}

export const eventBus = EventBus.getInstance();