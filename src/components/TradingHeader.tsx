
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Menu } from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { MarketData } from '@/lib/dataService';

interface TradingHeaderProps {
  marketData: MarketData[] | undefined;
  autoRefresh: boolean;
  signalCount: number;
  totalNotifications: number;
  onAutoRefreshToggle: () => void;
  onNotificationsClick: () => void;
  isMobile?: boolean;
  onSidebarToggle?: () => void;
}

export function TradingHeader({ 
  marketData, 
  autoRefresh, 
  signalCount, 
  totalNotifications, 
  onAutoRefreshToggle, 
  onNotificationsClick,
  isMobile = false,
  onSidebarToggle
}: TradingHeaderProps) {
  console.log('🔔 TradingHeader notification count:', totalNotifications);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Mobile Header Row 1: Logo and Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/0f69c4be-c21f-40a7-bfca-b6c55dc0202c.png" 
              alt="Algo Traders Pro" 
              className="w-8 h-8"
            />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ALGO TRADERS PRO
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onNotificationsClick}
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center"
                >
                  {totalNotifications > 99 ? '99+' : totalNotifications}
                </Badge>
              )}
            </Button>
            
            {onSidebarToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSidebarToggle}
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header Row 2: Status and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              marketData ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            <span className={`text-xs ${
              marketData ? 'text-green-400' : 'text-amber-400'
            }`}>
              {marketData ? 'CONNECTED' : 'CONNECTING'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1">
              Signals: {signalCount}
            </Badge>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={onAutoRefreshToggle}
              className="text-xs"
            >
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <DashboardHeader
        marketData={marketData}
        autoRefresh={autoRefresh}
        signalCount={signalCount}
        onAutoRefreshToggle={onAutoRefreshToggle}
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onNotificationsClick}
        className="relative"
      >
        <Bell className="w-4 h-4 mr-2" />
        Notifications
        {totalNotifications > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center"
          >
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </Badge>
        )}
      </Button>
    </div>
  );
}
