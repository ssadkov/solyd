export interface JupiterPriceData {
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
}

export interface JupiterPriceResponse {
  [mintAddress: string]: JupiterPriceData;
}

export class JupiterPriceService {
  private static readonly BASE_URL = 'https://lite-api.jup.ag/price/v3';
  private static cache = new Map<string, { data: JupiterPriceResponse; timestamp: number }>();
  private static readonly CACHE_DURATION = 60000; // 1 minute cache

  /**
   * Получить цены для списка токенов
   */
  static async getPrices(mintAddresses: string[]): Promise<JupiterPriceResponse> {
    if (mintAddresses.length === 0) {
      return {};
    }

    // Проверяем кэш
    const cacheKey = mintAddresses.sort().join(',');
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const ids = mintAddresses.join(',');
      const url = `${this.BASE_URL}?ids=${encodeURIComponent(ids)}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jupiter Price API error: ${response.status} ${response.statusText}`);
      }

      const data: JupiterPriceResponse = await response.json();
      
      // Сохраняем в кэш
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error('Error fetching prices from Jupiter API:', error);
      
      // Возвращаем пустой объект в случае ошибки
      return {};
    }
  }

  /**
   * Получить цену для одного токена
   */
  static async getPrice(mintAddress: string): Promise<JupiterPriceData | null> {
    const prices = await this.getPrices([mintAddress]);
    return prices[mintAddress] || null;
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
