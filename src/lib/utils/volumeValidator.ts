
export interface VolumeExpectations {
  min: number;
  realistic: number;
}

export interface VolumeValidation {
  isRealistic: boolean;
  isHigh: boolean;
  qualityBonus: number;
  volumeScore: number;
}

export class VolumeValidator {
  private static volumeExpectations: Record<string, VolumeExpectations> = {
    'BTC/USDT': { min: 500_000_000, realistic: 1_000_000_000 },
    'ETH/USDT': { min: 300_000_000, realistic: 600_000_000 },
    'ADA/USDT': { min: 50_000_000, realistic: 100_000_000 },
    'SOL/USDT': { min: 30_000_000, realistic: 80_000_000 },
    'XRP/USDT': { min: 100_000_000, realistic: 200_000_000 },
    'DOGE/USDT': { min: 200_000_000, realistic: 500_000_000 },
    'DOT/USDT': { min: 20_000_000, realistic: 50_000_000 },
    'LINK/USDT': { min: 15_000_000, realistic: 40_000_000 },
    'AVAX/USDT': { min: 10_000_000, realistic: 30_000_000 }
  };

  static validateVolume(volume: number, symbol: string): VolumeValidation {
    const expectations = this.volumeExpectations[symbol] || 
                        { min: 5_000_000, realistic: 20_000_000 };

    const isRealistic = volume >= expectations.min;
    const isHigh = volume >= expectations.realistic;
    
    return {
      isRealistic,
      isHigh,
      qualityBonus: isHigh ? 25 : isRealistic ? 15 : 5,
      volumeScore: Math.min((volume / expectations.realistic) * 30, 30)
    };
  }
}
