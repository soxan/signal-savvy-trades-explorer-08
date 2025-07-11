import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  RefreshCw,
  Eye
} from 'lucide-react';
import { MarketData } from '@/lib/types/marketData';
import { CandlestickData } from '@/lib/technicalAnalysis';

interface DataQualityReport {
  overall: {
    score: number;
    status: 'EXCELLENT' | 'GOOD' | 'POOR' | 'CRITICAL';
  };
  marketData: {
    completeness: number;
    accuracy: number;
    timeliness: number;
    consistency: number;
    issues: string[];
  };
  candlestickData: {
    completeness: number;
    accuracy: number;
    consistency: number;
    gaps: number;
    issues: string[];
  };
  recommendations: string[];
}

interface DataQualityMonitorProps {
  marketData?: MarketData[];
  candlestickData?: CandlestickData[];
  selectedPair: string;
}

export function DataQualityMonitor({ 
  marketData, 
  candlestickData, 
  selectedPair 
}: DataQualityMonitorProps) {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const validateMarketData = useCallback((data: MarketData[]): any => {
    if (!data || data.length === 0) {
      return {
        completeness: 0,
        accuracy: 0,
        timeliness: 0,
        consistency: 0,
        issues: ['No market data available']
      };
    }

    const issues: string[] = [];
    let completenessScore = 100;
    let accuracyScore = 100;
    let timelinessScore = 85; // Default good score since we can't check actual timestamps
    let consistencyScore = 100;

    // Check data completeness
    const requiredFields = ['symbol', 'price', 'change24h', 'volume24h', 'high24h', 'low24h'];
    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!(field in item) || item[field as keyof MarketData] === null || item[field as keyof MarketData] === undefined) {
          completenessScore -= 2;
          if (index < 3) issues.push(`Missing ${field} in ${item.symbol || 'unknown symbol'}`);
        }
      });
    });

    // Check price accuracy
    data.forEach(item => {
      if (item.price <= 0) {
        accuracyScore -= 5;
        issues.push(`Invalid price for ${item.symbol}: ${item.price}`);
      }
      if (item.high24h < item.low24h) {
        accuracyScore -= 5;
        issues.push(`High24h < Low24h for ${item.symbol}`);
      }
      if (item.price > item.high24h || item.price < item.low24h) {
        accuracyScore -= 3;
        issues.push(`Current price outside 24h range for ${item.symbol}`);
      }
    });

    // Check volume consistency
    const avgVolume = data.reduce((sum, item) => sum + (item.volume24h || 0), 0) / data.length;
    data.forEach(item => {
      if (item.volume24h && (item.volume24h > avgVolume * 10 || item.volume24h < avgVolume * 0.01)) {
        consistencyScore -= 2;
        if (issues.length < 10) issues.push(`Unusual volume for ${item.symbol}: ${item.volume24h.toFixed(0)}`);
      }
    });

    // Check for zero or negative values that indicate stale data
    data.forEach(item => {
      if (item.volume24h === 0) {
        timelinessScore -= 5;
        if (issues.length < 10) issues.push(`Zero volume detected for ${item.symbol} - possibly stale data`);
      }
    });

    return {
      completeness: Math.max(0, completenessScore),
      accuracy: Math.max(0, accuracyScore),
      timeliness: Math.max(0, timelinessScore),
      consistency: Math.max(0, consistencyScore),
      issues: issues.slice(0, 8) // Limit issues shown
    };
  }, []);

  const validateCandlestickData = useCallback((data: CandlestickData[]): any => {
    if (!data || data.length === 0) {
      return {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        gaps: 0,
        issues: ['No candlestick data available']
      };
    }

    const issues: string[] = [];
    let completenessScore = 100;
    let accuracyScore = 100;
    let consistencyScore = 100;
    let gaps = 0;

    // Check OHLCV data integrity
    data.forEach((candle, index) => {
      // Check for missing or invalid OHLCV values
      if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
        accuracyScore -= 5;
        if (issues.length < 5) issues.push(`Invalid OHLC values at index ${index}`);
      }

      // Check OHLC relationships
      if (candle.high < Math.max(candle.open, candle.close) || 
          candle.low > Math.min(candle.open, candle.close)) {
        accuracyScore -= 3;
        if (issues.length < 5) issues.push(`Invalid OHLC relationship at index ${index}`);
      }

      // Check for zero volume (suspicious)
      if (candle.volume === 0) {
        consistencyScore -= 2;
        if (issues.length < 5) issues.push(`Zero volume at index ${index}`);
      }
    });

    // Check for time gaps
    for (let i = 1; i < data.length; i++) {
      const timeDiff = data[i].timestamp - data[i-1].timestamp;
      const expectedDiff = 3600000; // 1 hour in milliseconds (assuming 1h timeframe)
      
      if (Math.abs(timeDiff - expectedDiff) > expectedDiff * 0.1) { // 10% tolerance
        gaps++;
        if (gaps <= 3) issues.push(`Time gap detected between index ${i-1} and ${i}`);
      }
    }

    // Check data completeness
    const expectedLength = 200; // Assuming we expect ~200 candles
    if (data.length < expectedLength * 0.8) {
      completenessScore -= 20;
      issues.push(`Insufficient data: ${data.length} candles (expected ~${expectedLength})`);
    }

    return {
      completeness: Math.max(0, completenessScore),
      accuracy: Math.max(0, accuracyScore),
      consistency: Math.max(0, consistencyScore),
      gaps,
      issues: issues.slice(0, 6)
    };
  }, []);

  const analyzeDataQuality = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      console.log('🔍 Analyzing data quality...');
      
      const marketValidation = validateMarketData(marketData || []);
      const candlestickValidation = validateCandlestickData(candlestickData || []);
      
      // Calculate overall score
      const marketScore = (marketValidation.completeness + marketValidation.accuracy + 
                          marketValidation.timeliness + marketValidation.consistency) / 4;
      const candlestickScore = (candlestickValidation.completeness + candlestickValidation.accuracy + 
                               candlestickValidation.consistency) / 3;
      
      const overallScore = (marketScore + candlestickScore) / 2;
      
      // Determine status
      let status: 'EXCELLENT' | 'GOOD' | 'POOR' | 'CRITICAL';
      if (overallScore >= 90) status = 'EXCELLENT';
      else if (overallScore >= 70) status = 'GOOD';
      else if (overallScore >= 50) status = 'POOR';
      else status = 'CRITICAL';

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (marketValidation.completeness < 90) {
        recommendations.push('Improve market data completeness by adding missing fields');
      }
      if (marketValidation.accuracy < 80) {
        recommendations.push('Implement stricter data validation for market prices');
      }
      if (candlestickValidation.gaps > 5) {
        recommendations.push('Address time gaps in candlestick data');
      }
      if (marketValidation.timeliness < 80) {
        recommendations.push('Increase data refresh frequency');
      }
      if (candlestickValidation.consistency < 80) {
        recommendations.push('Implement volume anomaly detection');
      }
      if (overallScore < 70) {
        recommendations.push('Consider switching to more reliable data sources');
      }

      const qualityReport: DataQualityReport = {
        overall: {
          score: Math.round(overallScore),
          status
        },
        marketData: marketValidation,
        candlestickData: candlestickValidation,
        recommendations
      };

      setReport(qualityReport);
      console.log('📊 Data Quality Report:', qualityReport);
      
    } catch (error) {
      console.error('❌ Error analyzing data quality:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [marketData, candlestickData, validateMarketData, validateCandlestickData]);

  useEffect(() => {
    if (marketData || candlestickData) {
      analyzeDataQuality();
    }
  }, [marketData, candlestickData, analyzeDataQuality]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'POOR': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Quality Monitor - {selectedPair}
          </div>
          <Button 
            onClick={analyzeDataQuality}
            disabled={isAnalyzing}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isAnalyzing ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Analyzing data quality...</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Overall Quality Score */}
            <div className={`p-4 rounded-lg border-2 ${
              report.overall.status === 'EXCELLENT' ? 'border-green-200 bg-green-50' :
              report.overall.status === 'GOOD' ? 'border-blue-200 bg-blue-50' :
              report.overall.status === 'POOR' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">Data Quality: {report.overall.status}</h3>
                    <p className="text-sm opacity-80">Overall Score: {report.overall.score}/100</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{report.overall.score}</div>
                  <div className="text-sm opacity-80">Score</div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Market Data Quality */}
              <div className="space-y-4">
                <h4 className="font-semibold">Market Data Quality</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completeness</span>
                      <span>{report.marketData.completeness}%</span>
                    </div>
                    <Progress value={report.marketData.completeness} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy</span>
                      <span>{report.marketData.accuracy}%</span>
                    </div>
                    <Progress value={report.marketData.accuracy} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Timeliness</span>
                      <span>{report.marketData.timeliness}%</span>
                    </div>
                    <Progress value={report.marketData.timeliness} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Consistency</span>
                      <span>{report.marketData.consistency}%</span>
                    </div>
                    <Progress value={report.marketData.consistency} />
                  </div>
                </div>

                {report.marketData.issues.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-600 mb-2">Issues Found:</h5>
                    <ul className="text-sm space-y-1">
                      {report.marketData.issues.map((issue, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-red-500" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Candlestick Data Quality */}
              <div className="space-y-4">
                <h4 className="font-semibold">Candlestick Data Quality</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completeness</span>
                      <span>{report.candlestickData.completeness}%</span>
                    </div>
                    <Progress value={report.candlestickData.completeness} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy</span>
                      <span>{report.candlestickData.accuracy}%</span>
                    </div>
                    <Progress value={report.candlestickData.accuracy} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Consistency</span>
                      <span>{report.candlestickData.consistency}%</span>
                    </div>
                    <Progress value={report.candlestickData.consistency} />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Time Gaps:</span>
                    <Badge variant={report.candlestickData.gaps > 5 ? 'destructive' : 'default'}>
                      {report.candlestickData.gaps}
                    </Badge>
                  </div>
                </div>

                {report.candlestickData.issues.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-600 mb-2">Issues Found:</h5>
                    <ul className="text-sm space-y-1">
                      {report.candlestickData.issues.map((issue, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-red-500" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No data available for quality analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
