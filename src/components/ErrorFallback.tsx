
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface ErrorFallbackProps {
  onRetry: () => void;
  autoRefresh: boolean;
  onAutoRefreshToggle: () => void;
}

export function ErrorFallback({ onRetry, autoRefresh, onAutoRefreshToggle }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Connection Issues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Unable to connect to market data sources. This may be temporary.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-amber-400">• Checking data providers...</p>
              <p className="text-amber-400">• Retrying connections...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onRetry} className="flex-1">
              Retry Now
            </Button>
            <Button variant="outline" onClick={onAutoRefreshToggle}>
              {autoRefresh ? 'Pause' : 'Resume'} Auto-Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
