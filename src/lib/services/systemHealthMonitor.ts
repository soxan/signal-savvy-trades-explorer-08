interface HealthMetrics {
  api: { status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'; lastCheck: number; errors: number };
  data: { status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'; lastCheck: number; errors: number };
  signals: { status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'; lastCheck: number; errors: number };
  trading: { status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'; lastCheck: number; errors: number };
  storage: { status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'; lastCheck: number; errors: number };
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  lastUpdate: number;
}

class SystemHealthMonitor {
  private static instance: SystemHealthMonitor;
  private healthMetrics: HealthMetrics;
  private performanceMetrics: PerformanceMetrics;
  private errorHistory: string[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.healthMetrics = {
      api: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      data: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      signals: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      trading: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      storage: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 }
    };
    this.performanceMetrics = {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      lastUpdate: Date.now()
    };
  }

  static getInstance(): SystemHealthMonitor {
    if (!SystemHealthMonitor.instance) {
      SystemHealthMonitor.instance = new SystemHealthMonitor();
    }
    return SystemHealthMonitor.instance;
  }

  startMonitoring(): void {
    if (this.monitoringInterval) return;

    console.log('⚙️ Starting system health monitoring...');

    this.monitoringInterval = setInterval(() => {
      this.checkApiHealth();
      this.checkDataHealth();
      this.checkSignalHealth();
      this.checkTradingHealth();
      this.checkStorageHealth();
      this.updatePerformanceMetrics();
    }, 60000); // Check every minute
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 System health monitoring stopped');
    }
  }

  resetHealth(): void {
    console.log('🔄 Resetting system health monitoring...');
    
    // Reset all metrics to healthy defaults
    this.healthMetrics = {
      api: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      data: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      signals: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      trading: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 },
      storage: { status: 'HEALTHY', lastCheck: Date.now(), errors: 0 }
    };
    
    // Clear error history
    this.errorHistory = [];
    
    // Reset performance metrics
    this.performanceMetrics = {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      lastUpdate: Date.now()
    };
    
    console.log('✅ System health monitoring reset completed');
  }

  private checkApiHealth(): void {
    const now = Date.now();
    try {
      // Simulate API check
      const isApiHealthy = Math.random() > 0.1; // 90% chance of success
      if (!isApiHealthy) {
        throw new Error('Simulated API outage');
      }
      this.healthMetrics.api = { status: 'HEALTHY', lastCheck: now, errors: 0 };
    } catch (error: any) {
      this.healthMetrics.api.errors++;
      this.errorHistory.push(`API Error: ${error.message}`);
      this.healthMetrics.api = { status: 'DEGRADED', lastCheck: now, errors: this.healthMetrics.api.errors };
      console.warn('⚠️ API health degraded:', error.message);
    }
  }

  private checkDataHealth(): void {
    const now = Date.now();
    try {
      // Simulate data check
      const isDataHealthy = Math.random() > 0.05; // 95% chance of success
      if (!isDataHealthy) {
        throw new Error('Data validation failed');
      }
      this.healthMetrics.data = { status: 'HEALTHY', lastCheck: now, errors: 0 };
    } catch (error: any) {
      this.healthMetrics.data.errors++;
      this.errorHistory.push(`Data Error: ${error.message}`);
      this.healthMetrics.data = { status: 'DEGRADED', lastCheck: now, errors: this.healthMetrics.data.errors };
      console.warn('⚠️ Data health degraded:', error.message);
    }
  }

  private checkSignalHealth(): void {
    const now = Date.now();
    try {
      // Simulate signal check
      const isSignalHealthy = Math.random() > 0.2; // 80% chance of success
      if (!isSignalHealthy) {
        throw new Error('Signal processing stalled');
      }
      this.healthMetrics.signals = { status: 'HEALTHY', lastCheck: now, errors: 0 };
    } catch (error: any) {
      this.healthMetrics.signals.errors++;
      this.errorHistory.push(`Signal Error: ${error.message}`);
      this.healthMetrics.signals = { status: 'DEGRADED', lastCheck: now, errors: this.healthMetrics.signals.errors };
      console.warn('⚠️ Signal health degraded:', error.message);
    }
  }

  private checkTradingHealth(): void {
    const now = Date.now();
    try {
      // Simulate trading check
      const isTradingHealthy = Math.random() > 0.15; // 85% chance of success
      if (!isTradingHealthy) {
        throw new Error('Trading engine offline');
      }
      this.healthMetrics.trading = { status: 'HEALTHY', lastCheck: now, errors: 0 };
    } catch (error: any) {
      this.healthMetrics.trading.errors++;
      this.errorHistory.push(`Trading Error: ${error.message}`);
      this.healthMetrics.trading = { status: 'DEGRADED', lastCheck: now, errors: this.healthMetrics.trading.errors };
      console.warn('⚠️ Trading health degraded:', error.message);
    }
  }

  private checkStorageHealth(): void {
    const now = Date.now();
    try {
      // Simulate storage check
      const isStorageHealthy = Math.random() > 0.08; // 92% chance of success
      if (!isStorageHealthy) {
        throw new Error('Storage system overloaded');
      }
      this.healthMetrics.storage = { status: 'HEALTHY', lastCheck: now, errors: 0 };
    } catch (error: any) {
      this.healthMetrics.storage.errors++;
      this.errorHistory.push(`Storage Error: ${error.message}`);
      this.healthMetrics.storage = { status: 'DEGRADED', lastCheck: now, errors: this.healthMetrics.storage.errors };
      console.warn('⚠️ Storage health degraded:', error.message);
    }
  }

  private updatePerformanceMetrics(): void {
    const now = Date.now();
    // Simulate performance update
    this.performanceMetrics = {
      responseTime: Math.random() * 150, // 0-150ms
      throughput: Math.random() * 1000, // 0-1000 ops/sec
      errorRate: Math.random() * 0.01, // 0-1%
      lastUpdate: now
    };
  }

  getOverallHealth(): { overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'; details: string } {
    let criticalCount = 0;
    let degradedCount = 0;

    Object.values(this.healthMetrics).forEach(metric => {
      if (metric.status === 'CRITICAL') criticalCount++;
      if (metric.status === 'DEGRADED') degradedCount++;
    });

    if (criticalCount >= 3) {
      return { overall: 'CRITICAL', details: 'Multiple critical failures' };
    } else if (degradedCount >= 3 || criticalCount > 0) {
      return { overall: 'DEGRADED', details: 'Degraded performance detected' };
    } else {
      return { overall: 'HEALTHY', details: 'All systems nominal' };
    }
  }

  getHealthMetrics(): HealthMetrics {
    return { ...this.healthMetrics };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getErrorHistory(): string[] {
    return [...this.errorHistory.slice(-10)];
  }
}

export const systemHealthMonitor = SystemHealthMonitor.getInstance();
