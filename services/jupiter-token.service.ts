export interface JupiterTokenData {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  usdPrice: number;
  priceBlockId: number;
  stats24h?: {
    priceChange: number;
  };
  isVerified?: boolean;
  tags?: string[];
}

export interface JupiterTokenResponse {
  [mintAddress: string]: JupiterTokenData;
}

export class JupiterTokenService {
  private static readonly BASE_URL = 'https://lite-api.jup.ag/tokens/v2/search';
  private static cache = new Map<string, { data: JupiterTokenData[]; timestamp: number }>();
  private static readonly CACHE_DURATION = 300000; // 5 minutes cache

  /**
   * Получить информацию о токенах по их mint адресам
   */
  static async getTokens(mintAddresses: string[]): Promise<JupiterTokenData[]> {
    if (mintAddresses.length === 0) {
      return [];
    }

    // Проверяем кэш
    const cacheKey = mintAddresses.sort().join(',');
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const query = mintAddresses.join(',');
      const url = `${this.BASE_URL}?query=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jupiter Token API error: ${response.status} ${response.statusText}`);
      }

      const data: JupiterTokenData[] = await response.json();
      
      // Сохраняем в кэш
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error('Error fetching tokens from Jupiter API:', error);
      
      // Возвращаем пустой массив в случае ошибки
      return [];
    }
  }

  /**
   * Получить информацию об одном токене
   */
  static async getToken(mintAddress: string): Promise<JupiterTokenData | null> {
    const tokens = await this.getTokens([mintAddress]);
    return tokens[0] || null;
  }

  /**
   * Очистить кэш
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Получить размер кэша
   */
  static getCacheSize(): number {
    return this.cache.size;
  }
}
