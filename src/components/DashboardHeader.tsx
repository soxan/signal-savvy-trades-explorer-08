
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { MarketData } from '@/lib/dataService';

interface DashboardHeaderProps {
  marketData: MarketData[] | undefined;
  autoRefresh: boolean;
  signalCount: number;
  onAutoRefreshToggle: () => void;
}

export function DashboardHeader({ 
  marketData, 
  autoRefresh, 
  signalCount, 
  onAutoRefreshToggle 
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/0f69c4be-c21f-40a7-bfca-b6c55dc0202c.png" 
            alt="Algo Traders Pro" 
            className="w-16 h-16"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ALGO TRADERS PRO
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Advanced Trading Signal Analysis
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
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="px-3 py-1 text-cyan-400 border-cyan-400">
          Leverage: 20-25x
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          Signals: {signalCount}
        </Badge>
        <Badge variant={marketData && autoRefresh ? "default" : "outline"} className="px-3 py-1">
          {marketData && autoRefresh ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Live Updates
            </div>
          ) : (
            'Updates Paused'
          )}
        </Badge>
        <Button
          variant={autoRefresh ? "default" : "outline"}
          onClick={onAutoRefreshToggle}
          className="gap-2"
        >
          <Activity className="w-4 h-4" />
          {autoRefresh ? 'Live Mode' : 'Start Live'}
        </Button>
      </div>
    </div>
  );
}
