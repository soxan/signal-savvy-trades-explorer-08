
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { TradingSignal } from '@/lib/technicalAnalysis';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SignalCopyActionsProps {
  signal: TradingSignal;
  pair: string;
  size?: 'sm' | 'default';
}

export function SignalCopyActions({ signal, pair, size = 'default' }: SignalCopyActionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (value: string | number, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(value.toString());
      setCopiedField(fieldName);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard: ${value}`,
        duration: 2000
      });
      
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return price > 1 ? price.toFixed(2) : price.toFixed(6);
  };

  const CopyButton = ({ value, label, fieldKey }: { value: number; label: string; fieldKey: string }) => {
    const isCopied = copiedField === fieldKey;
    const buttonSize = size === 'sm' ? 'sm' : 'default';
    
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
        <div className="flex-1 text-center">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-bold text-sm">${formatPrice(value)}</div>
        </div>
        <Button
          size={buttonSize}
          variant="ghost"
          onClick={() => copyToClipboard(formatPrice(value), label)}
          className="p-2 h-auto"
        >
          {isCopied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant={signal.type === 'BUY' ? 'default' : 'destructive'} className="text-xs">
          {signal.type} - {pair}
        </Badge>
        <Button
          size={size}
          variant="outline"
          onClick={() => {
            const signalText = `${signal.type} ${pair}\nEntry: $${formatPrice(signal.entry)}\nStop Loss: $${formatPrice(signal.stopLoss)}\nTake Profit: $${formatPrice(signal.takeProfit)}\nRisk/Reward: ${signal.riskReward.toFixed(2)}:1\nPosition Size: ${signal.positionSize.toFixed(1)}%`;
            copyToClipboard(signalText, 'Complete Signal');
          }}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy All
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <CopyButton 
          value={signal.entry} 
          label="Entry Price" 
          fieldKey="entry"
        />
        
        <CopyButton 
          value={signal.stopLoss} 
          label="Stop Loss" 
          fieldKey="stopLoss"
        />
        
        <CopyButton 
          value={signal.takeProfit} 
          label="Take Profit" 
          fieldKey="takeProfit"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className="text-muted-foreground">Risk/Reward</div>
          <div className="font-medium">{signal.riskReward.toFixed(2)}:1</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className="text-muted-foreground">Position Size</div>
          <div className="font-medium">{signal.positionSize.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
