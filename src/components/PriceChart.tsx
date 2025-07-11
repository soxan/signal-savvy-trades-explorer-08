
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { CandlestickData, TradingSignal } from '@/lib/technicalAnalysis';

interface PriceChartProps {
  data: CandlestickData[];
  signal: TradingSignal | null;
  pair: string;
  timeframe: string;
}

export function PriceChart({ data, signal, pair, timeframe }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.slice(-100).map((candle, index) => ({
      index,
      time: format(new Date(candle.timestamp), 'HH:mm'),
      price: candle.close,
      high: candle.high,
      low: candle.low,
      open: candle.open,
      volume: candle.volume
    }));
  }, [data]);

  const currentPrice = data?.[data.length - 1]?.close || 0;
  const priceChange = data && data.length >= 2 ? 
    data[data.length - 1].close - data[data.length - 2].close : 0;
  const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        Loading chart data...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Price Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-2xl font-bold">
              ${currentPrice.toFixed(currentPrice > 1 ? 2 : 6)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${
              priceChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)} 
              ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
        
        {signal && signal.type !== 'NEUTRAL' && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            signal.type === 'BUY' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {signal.type} Signal - {(signal.confidence * 100).toFixed(0)}% Confidence
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={['dataMin - 0.1%', 'dataMax + 0.1%']}
              tickFormatter={(value) => value > 1 ? value.toFixed(2) : value.toFixed(6)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
              formatter={(value: number) => [
                `$${value > 1 ? value.toFixed(2) : value.toFixed(6)}`,
                'Price'
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            
            <Line
              type="monotone"
              dataKey="price"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#06B6D4', strokeWidth: 2 }}
            />
            
            {/* Signal Lines */}
            {signal && signal.type !== 'NEUTRAL' && (
              <>
                <ReferenceLine 
                  y={signal.entry} 
                  stroke={signal.type === 'BUY' ? '#10B981' : '#EF4444'} 
                  strokeDasharray="5 5"
                  label={{ value: "Entry", position: "top" }}
                />
                <ReferenceLine 
                  y={signal.takeProfit} 
                  stroke="#10B981" 
                  strokeDasharray="3 3"
                  label={{ value: "TP", position: "top" }}
                />
                <ReferenceLine 
                  y={signal.stopLoss} 
                  stroke="#EF4444" 
                  strokeDasharray="3 3"
                  label={{ value: "SL", position: "top" }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
        <div>
          <div className="font-medium text-foreground">High 24h</div>
          <div>${data[data.length - 1]?.high.toFixed(currentPrice > 1 ? 2 : 6)}</div>
        </div>
        <div>
          <div className="font-medium text-foreground">Low 24h</div>
          <div>${data[data.length - 1]?.low.toFixed(currentPrice > 1 ? 2 : 6)}</div>
        </div>
        <div>
          <div className="font-medium text-foreground">Volume</div>
          <div>{(data[data.length - 1]?.volume || 0).toLocaleString()}</div>
        </div>
        <div>
          <div className="font-medium text-foreground">Data Points</div>
          <div>{data.length} candles</div>
        </div>
      </div>
    </div>
  );
}
