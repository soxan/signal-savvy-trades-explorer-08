
import { useState, useEffect } from 'react';
import { TradingHeader } from './TradingHeader';
import { TradingSidebar } from './TradingSidebar';
import { TradingMainContent } from './TradingMainContent';
import { ErrorFallback } from './ErrorFallback';
import { ErrorBoundary } from './ErrorBoundary';
import { NotificationCenter } from './NotificationCenter';
import { ComprehensiveTestSuite } from './ComprehensiveTestSuite';
import { useTradingData } from '@/hooks/useTradingData';
import { useUnifiedSignalGeneration } from '@/hooks/useUnifiedSignalGeneration';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useIsMobile } from '@/hooks/use-mobile';

export function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('trading');
  const isMobile = useIsMobile();

  const {
    marketData,
    candlestickData,
    selectedMarketData,
    isMarketLoading,
    lastMarketUpdate,
    apiError,
    marketError,
    candleError,
    refetchMarket,
    refetchCandles
  } = useTradingData(selectedPair, selectedTimeframe, autoRefresh);

  // Fixed: Add marketData as the third required parameter
  const { currentSignal, signalHistory, persistedSignals, isProcessing } = useUnifiedSignalGeneration(
    candlestickData, 
    selectedPair,
    marketData || []
  );
  
  const { checkAlerts, activeAlerts, triggeredAlerts } = usePriceAlerts();

  useEffect(() => {
    if (marketData && marketData.length > 0) {
      checkAlerts(marketData);
    }
  }, [marketData, checkAlerts]);

  useEffect(() => {
    const calculateNotificationCount = () => {
      try {
        const stored = localStorage.getItem('trading_notifications');
        const systemNotifications = stored ? JSON.parse(stored) : [];
        
        const unreadSystemNotifications = systemNotifications.filter((n: any) => !n.isRead).length;
        const totalUnread = triggeredAlerts.length + unreadSystemNotifications;
        
        console.log('🔔 Notification count calculation:', {
          triggeredAlerts: triggeredAlerts.length,
          unreadSystem: unreadSystemNotifications,
          total: totalUnread
        });
        
        setNotificationCount(totalUnread);
        return totalUnread;
      } catch (error) {
        console.error('Error calculating notification count:', error);
        return 0;
      }
    };

    calculateNotificationCount();

    const handleNotificationUpdate = (event: any) => {
      console.log('🔔 Dashboard received notification update event');
      setTimeout(calculateNotificationCount, 100);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'trading_notifications') {
        console.log('🔔 System notifications storage changed');
        setTimeout(calculateNotificationCount, 100);
      }
    };

    window.addEventListener('notificationCountUpdated', handleNotificationUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(calculateNotificationCount, 2000);

    return () => {
      window.removeEventListener('notificationCountUpdated', handleNotificationUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [triggeredAlerts.length]);

  if (marketError || candleError || apiError) {
    return (
      <ErrorFallback
        onRetry={() => {
          refetchMarket();
          refetchCandles();
        }}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className={`${isMobile ? 'p-2' : 'p-6'} max-w-full`}>
          <div className={`${isMobile ? 'max-w-full' : 'max-w-7xl'} mx-auto space-y-${isMobile ? '3' : '6'}`}>
            <div className="space-y-4">
              <ErrorBoundary>
                <TradingHeader
                  marketData={marketData}
                  autoRefresh={autoRefresh}
                  signalCount={signalHistory.filter(s => s.signal.type !== 'NEUTRAL').length}
                  totalNotifications={notificationCount}
                  onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
                  onNotificationsClick={() => setShowNotifications(true)}
                  isMobile={isMobile}
                  onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                />
              </ErrorBoundary>

              <div className="flex space-x-1 border-b">
                <button
                  onClick={() => setActiveTab('trading')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'trading'
                      ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Live Trading
                </button>
                <button
                  onClick={() => setActiveTab('testing')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'testing'
                      ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Testing Suite
                </button>
              </div>
            </div>

            {activeTab === 'trading' ? (
              <ErrorBoundary>
                {isMobile ? (
                  <div className="space-y-4">
                    {sidebarOpen && (
                      <div className="bg-card border rounded-lg p-4">
                        <ErrorBoundary>
                          <TradingSidebar
                            selectedPair={selectedPair}
                            selectedTimeframe={selectedTimeframe}
                            onPairChange={(pair) => {
                              setSelectedPair(pair);
                              setSidebarOpen(false);
                            }}
                            onTimeframeChange={setSelectedTimeframe}
                            marketData={marketData || []}
                          />
                        </ErrorBoundary>
                      </div>
                    )}

                    <div className="w-full">
                      <ErrorBoundary>
                        <TradingMainContent
                          selectedPair={selectedPair}
                          selectedTimeframe={selectedTimeframe}
                          currentSignal={currentSignal}
                          selectedMarketData={selectedMarketData}
                          isMarketLoading={isMarketLoading}
                          lastMarketUpdate={lastMarketUpdate}
                          candlestickData={candlestickData}
                          signalHistory={signalHistory}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-6">
                    <ErrorBoundary>
                      <TradingSidebar
                        selectedPair={selectedPair}
                        selectedTimeframe={selectedTimeframe}
                        onPairChange={setSelectedPair}
                        onTimeframeChange={setSelectedTimeframe}
                        marketData={marketData || []}
                      />
                    </ErrorBoundary>

                    <ErrorBoundary>
                      <TradingMainContent
                        selectedPair={selectedPair}
                        selectedTimeframe={selectedTimeframe}
                        currentSignal={currentSignal}
                        selectedMarketData={selectedMarketData}
                        isMarketLoading={isMarketLoading}
                        lastMarketUpdate={lastMarketUpdate}
                        candlestickData={candlestickData}
                        signalHistory={signalHistory}
                      />
                    </ErrorBoundary>
                  </div>
                )}
              </ErrorBoundary>
            ) : (
              <ErrorBoundary>
                <div className="w-full">
                  <ComprehensiveTestSuite />
                </div>
              </ErrorBoundary>
            )}
          </div>
        </div>

        <ErrorBoundary>
          <NotificationCenter 
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            isMobile={isMobile}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
