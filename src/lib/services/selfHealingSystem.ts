import { systemHealthMonitor } from './systemHealthMonitor';
import { signalCoordinator } from './signalCoordinator';
import { optimizedSignalProcessor } from './optimizedSignalProcessor';

interface HealingAction {
  name: string;
  execute: () => Promise<boolean>;
  priority: number;
  lastExecuted: number;
  cooldown: number;
}

class SelfHealingSystem {
  private static instance: SelfHealingSystem;
  private healingActions: HealingAction[] = [];
  private isHealing = false;
  private healingHistory: Array<{ timestamp: number; action: string; success: boolean }> = [];

  static getInstance(): SelfHealingSystem {
    if (!SelfHealingSystem.instance) {
      SelfHealingSystem.instance = new SelfHealingSystem();
    }
    return SelfHealingSystem.instance;
  }

  constructor() {
    this.initializeHealingActions();
    this.startAutoHealing();
  }

  private initializeHealingActions() {
    this.healingActions = [
      {
        name: 'Clear Signal Processing Cache',
        execute: async () => {
          try {
            signalCoordinator.clearProcessingState();
            optimizedSignalProcessor.clearCache();
            console.log('🔧 Self-healing: Cleared signal processing cache');
            return true;
          } catch (error) {
            console.error('❌ Self-healing failed: Cache clear error', error);
            return false;
          }
        },
        priority: 1,
        lastExecuted: 0,
        cooldown: 300000 // 5 minutes
      },
      {
        name: 'Reset System Health Monitoring',
        execute: async () => {
          try {
            systemHealthMonitor.resetHealth();
            console.log('🔧 Self-healing: Reset system health monitoring');
            return true;
          } catch (error) {
            console.error('❌ Self-healing failed: Health monitor reset error', error);
            return false;
          }
        },
        priority: 2,
        lastExecuted: 0,
        cooldown: 600000 // 10 minutes
      },
      {
        name: 'Clean LocalStorage',
        execute: async () => {
          try {
            const criticalKeys = ['paper_trades', 'trading_signals_history', 'trading_notifications'];
            let cleaned = 0;
            
            // Clean old entries from critical storages
            criticalKeys.forEach(key => {
              try {
                const data = localStorage.getItem(key);
                if (data) {
                  const parsed = JSON.parse(data);
                  if (Array.isArray(parsed)) {
                    // Keep only last 100 entries
                    const trimmed = parsed.slice(-100);
                    if (trimmed.length < parsed.length) {
                      localStorage.setItem(key, JSON.stringify(trimmed));
                      cleaned++;
                    }
                  }
                }
              } catch (error) {
                console.warn(`Self-healing: Could not clean ${key}`, error);
              }
            });
            
            console.log(`🔧 Self-healing: Cleaned ${cleaned} storage entries`);
            return true;
          } catch (error) {
            console.error('❌ Self-healing failed: Storage cleanup error', error);
            return false;
          }
        },
        priority: 3,
        lastExecuted: 0,
        cooldown: 1800000 // 30 minutes
      },
      {
        name: 'Memory Optimization',
        execute: async () => {
          try {
            // Force garbage collection if available
            if (window.gc) {
              window.gc();
            }
            
            // Clear temporary caches
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(
                cacheNames.map(cacheName => {
                  if (cacheName.includes('temp') || cacheName.includes('old')) {
                    return caches.delete(cacheName);
                  }
                })
              );
            }
            
            console.log('🔧 Self-healing: Memory optimization completed');
            return true;
          } catch (error) {
            console.error('❌ Self-healing failed: Memory optimization error', error);
            return false;
          }
        },
        priority: 4,
        lastExecuted: 0,
        cooldown: 900000 // 15 minutes
      }
    ];
  }

  private startAutoHealing() {
    setInterval(async () => {
      if (this.isHealing) return;
      
      const health = systemHealthMonitor.getOverallHealth();
      
      // Trigger healing if system health is degraded
      if (health.overall === 'DEGRADED' || health.overall === 'CRITICAL') {
        console.log(`🚨 Self-healing triggered: System health is ${health.overall}`);
        await this.performHealing();
      }
      
      // Proactive healing every 10 minutes
      const now = Date.now();
      const lastProactiveHealing = this.healingHistory
        .filter(h => h.action.includes('Proactive'))
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (!lastProactiveHealing || (now - lastProactiveHealing.timestamp) > 600000) {
        await this.performProactiveHealing();
      }
    }, 60000); // Check every minute
  }

  private async performHealing(): Promise<void> {
    if (this.isHealing) return;
    
    this.isHealing = true;
    console.log('🔧 Starting self-healing sequence...');
    
    try {
      const now = Date.now();
      const availableActions = this.healingActions
        .filter(action => (now - action.lastExecuted) > action.cooldown)
        .sort((a, b) => a.priority - b.priority);
      
      for (const action of availableActions.slice(0, 2)) { // Execute max 2 actions
        console.log(`🔧 Executing healing action: ${action.name}`);
        const success = await action.execute();
        
        action.lastExecuted = now;
        this.healingHistory.push({
          timestamp: now,
          action: action.name,
          success
        });
        
        // Wait between actions
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('✅ Self-healing sequence completed');
    } catch (error) {
      console.error('❌ Self-healing sequence failed:', error);
    } finally {
      this.isHealing = false;
    }
  }

  private async performProactiveHealing(): Promise<void> {
    try {
      // Light maintenance tasks
      const lightActions = this.healingActions.filter(a => 
        a.name.includes('Cache') || a.name.includes('Memory')
      );
      
      const now = Date.now();
      for (const action of lightActions) {
        if ((now - action.lastExecuted) > action.cooldown) {
          await action.execute();
          action.lastExecuted = now;
          this.healingHistory.push({
            timestamp: now,
            action: `Proactive ${action.name}`,
            success: true
          });
          break; // Only one proactive action at a time
        }
      }
    } catch (error) {
      console.error('❌ Proactive healing failed:', error);
    }
  }

  getHealingStatus() {
    return {
      isHealing: this.isHealing,
      healingHistory: this.healingHistory.slice(-10),
      nextScheduledActions: this.healingActions.map(action => ({
        name: action.name,
        priority: action.priority,
        nextAvailable: new Date(action.lastExecuted + action.cooldown).toISOString()
      }))
    };
  }

  async manualHeal(actionName?: string): Promise<boolean> {
    if (this.isHealing) {
      console.log('⚠️ Self-healing already in progress');
      return false;
    }

    if (actionName) {
      const action = this.healingActions.find(a => a.name === actionName);
      if (action) {
        console.log(`🔧 Manual healing: ${actionName}`);
        const success = await action.execute();
        action.lastExecuted = Date.now();
        this.healingHistory.push({
          timestamp: Date.now(),
          action: `Manual ${actionName}`,
          success
        });
        return success;
      }
    } else {
      await this.performHealing();
      return true;
    }
    
    return false;
  }
}

export const selfHealingSystem = SelfHealingSystem.getInstance();
