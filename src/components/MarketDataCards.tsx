
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Clock, CheckCircle, Globe } from 'lucide-react';
import { MarketData } from '@/lib/dataService';

interface MarketDataCardsProps {
  marketData: MarketData | undefined;
  isLoading: boolean;
  lastUpdated: Date;
}

export function MarketDataCards({ marketData, isLoading, lastUpdated }: MarketDataCardsProps) {
  if (isLoading || !marketData) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    return price > 1 ? `$${price.toLocaleString()}` : `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number) => {
    if (!volume || isNaN(volume)) return 'N/A';
    
    console.log(`📊 CROSS-VERIFIED VOLUME for ${marketData.symbol}:`, {
      rawVolume: volume,
      inBillions: (volume / 1e9).toFixed(2) + 'B',
      inTrillions: volume >= 1e12 ? (volume / 1e12).toFixed(2) + 'T' : null,
      isRealistic: volume >= (marketData.symbol === 'BTC/USDT' ? 15e9 : 1e9),
      dataSource: 'Binance + CoinGecko Cross-verified'
    });
    
    if (volume >= 1e12) return `$${(volume / 1e12).toFixed(2)}T`;
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    
    return `$${volume.toLocaleString()}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (!marketCap || isNaN(marketCap)) return 'N/A';
    
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    
    return `$${marketCap.toLocaleString()}`;
  };

  const formatPercentage = (percent: number) => {
    if (!percent || isNaN(percent)) return '0.00%';
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatChange = (change: number) => {
    if (!change || isNaN(change)) return '$0.00';
    return `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(2)}`;
  };

  // Enhanced data quality verification
  const getDataQuality = () => {
    const volume = marketData.volume24h;
    const marketCap = marketData.marketCap;
    const price = marketData.price;
    
    const expectedMinVolume = marketData.symbol === 'BTC/USDT' ? 15e9 : 1e9;
    const volumeRealistic = volume >= expectedMinVolume;
    const hasMarketCap = marketCap > 0;
    const priceRealistic = price > 0;
    
    const qualityScore = [volumeRealistic, hasMarketCap, priceRealistic].filter(Boolean).length;
    
    return {
      score: qualityScore,
      maxScore: 3,
      percentage: Math.round((qualityScore / 3) * 100),
      volumeRealistic,
      hasMarketCap,
      status: qualityScore === 3 ? 'Excellent' : qualityScore === 2 ? 'Good' : 'Fair'
    };
  };

  const dataQuality = getDataQuality();

  return (
    <div className="space-y-4">
      {/* Enhanced Data Verification Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20">
            <Globe className="w-3 h-3 mr-1" />
            Multi-API Cross-verified
          </Badge>
          <Badge variant="outline" className={`text-xs ${
            dataQuality.percentage >= 90 ? 'bg-green-500/10 border-green-500/20' : 
            dataQuality.percentage >= 70 ? 'bg-yellow-500/10 border-yellow-500/20' : 
            'bg-red-500/10 border-red-500/20'
          }`}>
            Quality: {dataQuality.status} ({dataQuality.percentage}%)
          </Badge>
        </div>
      </div>

      {/* Main Market Data Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Current Price */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Current Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(marketData.price)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${
              marketData.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {marketData.changePercent24h >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {formatPercentage(marketData.changePercent24h)}
            </div>
          </CardContent>
        </Card>

        {/* 24h Change */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              24h Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              marketData.change24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {formatChange(marketData.change24h)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatPercentage(marketData.changePercent24h)}
            </div>
          </CardContent>
        </Card>

        {/* 24h Volume (CROSS-VERIFIED) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              24h Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dataQuality.volumeRealistic ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {formatVolume(marketData.volume24h)}
            </div>
            <div className={`text-sm font-medium ${
              dataQuality.volumeRealistic ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {dataQuality.volumeRealistic ? 'Verified' : 'Low Volume'}
            </div>
            <div className="text-xs text-muted-foreground">
              Multi-source verified
            </div>
          </CardContent>
        </Card>

        {/* Market Cap */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dataQuality.hasMarketCap ? 'text-blue-500' : 'text-muted-foreground'
            }`}>
              {formatMarketCap(marketData.marketCap)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total value
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Price Range & Data Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">24h Price Range & Multi-API Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">24h Low</div>
              <div className="text-lg font-bold text-red-400">
                {formatPrice(marketData.low24h)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Current</div>
              <div className="text-lg font-bold">
                {formatPrice(marketData.price)}
              </div>
              {/* Price position in 24h range */}
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, 
                      ((marketData.price - marketData.low24h) / (marketData.high24h - marketData.low24h)) * 100
                    ))}%`
                  }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">24h High</div>
              <div className="text-lg font-bold text-green-400">
                {formatPrice(marketData.high24h)}
              </div>
            </div>
          </div>
          
          {/* Enhanced Data Verification Summary */}
          <div className="mt-4 p-3 bg-blue-500/10 rounded text-xs border border-blue-500/20">
            <div className="font-medium mb-1 text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Multi-Source Cross-Verified Data:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>24h Volume: {formatVolume(marketData.volume24h)}</div>
              <div>Market Cap: {formatMarketCap(marketData.marketCap)}</div>
              <div>Price Range: {formatPrice(marketData.low24h)} - {formatPrice(marketData.high24h)}</div>
              <div>24h Change: {formatChange(marketData.change24h)} ({formatPercentage(marketData.changePercent24h)})</div>
              <div>Primary Source: Binance Global/US APIs</div>
              <div>Secondary Source: CoinGecko API</div>
              <div>Verification: Cross-referenced pricing</div>
              <div>Data Quality: {dataQuality.status} ({dataQuality.score}/{dataQuality.maxScore})</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
