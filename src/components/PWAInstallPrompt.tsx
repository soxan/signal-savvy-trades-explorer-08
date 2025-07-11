
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallPrompt = () => {
  const { showInstallPrompt, installApp, dismissInstallPrompt } = usePWAInstall();

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/7deeacba-2318-41c4-a9e4-6ae108b8a40f.png" 
                  alt="Algo Traders Pro" 
                  className="w-8 h-8"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground">
                Install Algo Traders Pro
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add to your home screen for quick access to trading signals
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  onClick={installApp}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Download className="w-3 h-3 mr-1.5" />
                  Install
                </Button>
                
                <Button
                  onClick={dismissInstallPrompt}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  Later
                </Button>
              </div>
              
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Smartphone className="w-3 h-3" />
                <span>Works offline for cached data</span>
              </div>
            </div>
            
            <Button
              onClick={dismissInstallPrompt}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
