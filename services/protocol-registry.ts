import { ProtocolService, ProtocolResult, ProtocolError, UserPosition } from '@/types/protocol'
import { AggregatorData } from '@/types/aggregator'

export class ProtocolRegistry {
  private protocols: Map<string, ProtocolService> = new Map()
  private readonly timeout = 15000 // 15 seconds timeout per protocol

  /**
   * Регистрирует новый протокол
   */
  register(protocol: ProtocolService): void {
    this.protocols.set(protocol.name, protocol)
    console.log(`Registered protocol: ${protocol.name} (${protocol.category})`)
  }

  /**
   * Получает все доступные протоколы
   */
  getProtocols(): ProtocolService[] {
    return Array.from(this.protocols.values())
  }

  /**
   * Получает протокол по имени
   */
  getProtocol(name: string): ProtocolService | undefined {
    return this.protocols.get(name)
  }

  /**
   * Получает все пулы из всех протоколов
   */
  async getAllPools(): Promise<AggregatorData[]> {
    const results = await this.executeInParallel(
      Array.from(this.protocols.values()).map(protocol => 
        this.wrapProtocolCall(protocol.name, () => protocol.getPools())
      )
    )

    // Объединяем успешные результаты
    const allPools: AggregatorData[] = []
    for (const result of results) {
      if (result.success && result.data) {
        allPools.push(...result.data)
      } else if (result.error) {
        console.warn(`Failed to fetch pools from ${result.protocol}:`, result.error.message)
      }
    }

    return allPools
  }

  /**
   * Получает все позиции пользователя из всех протоколов
   */
  async getUserPositions(walletAddress: string): Promise<UserPosition[]> {
    if (!walletAddress) {
      return []
    }

    const results = await this.executeInParallel(
      Array.from(this.protocols.values()).map(protocol => 
        this.wrapProtocolCall(protocol.name, () => protocol.getUserPositions(walletAddress))
      )
    )

    // Объединяем успешные результаты
    const allPositions: UserPosition[] = []
    for (const result of results) {
      if (result.success && result.data) {
        allPositions.push(...result.data)
      } else if (result.error) {
        console.warn(`Failed to fetch positions from ${result.protocol}:`, result.error.message)
      }
    }

    return allPositions
  }

  /**
   * Выполняет действие в конкретном протоколе
   */
  async executeAction(
    protocolName: string,
    action: string,
    ...args: any[]
  ): Promise<ProtocolResult<any>> {
    const protocol = this.protocols.get(protocolName)
    if (!protocol) {
      return {
        success: false,
        error: new ProtocolError(protocolName, 'Protocol not found'),
        protocol: protocolName
      }
    }

    try {
      let result: any
      
      switch (action) {
        case 'supply':
          result = await protocol.supply(args[0], args[1], args[2])
          break
        case 'withdraw':
          result = await protocol.withdraw(args[0], args[1], args[2])
          break
        case 'claimRewards':
          result = await protocol.claimRewards(args[0], args[1])
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      return {
        success: true,
        data: result,
        protocol: protocolName
      }
    } catch (error) {
      return {
        success: false,
        error: new ProtocolError(protocolName, `Action ${action} failed`, error as Error),
        protocol: protocolName
      }
    }
  }

  /**
   * Проверяет доступность всех протоколов
   */
  async checkAvailability(): Promise<Map<string, boolean>> {
    const results = await this.executeInParallel(
      Array.from(this.protocols.values()).map(protocol => 
        this.wrapProtocolCall(protocol.name, () => protocol.isAvailable())
      )
    )

    const availability = new Map<string, boolean>()
    for (const result of results) {
      availability.set(result.protocol, result.success && result.data === true)
    }

    return availability
  }

  /**
   * Обертка для выполнения операций протокола с таймаутом и обработкой ошибок
   */
  private async wrapProtocolCall<T>(
    protocolName: string,
    operation: () => Promise<T>
  ): Promise<ProtocolResult<T>> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
      })

      const result = await Promise.race([operation(), timeoutPromise])
      
      return {
        success: true,
        data: result,
        protocol: protocolName
      }
    } catch (error) {
      return {
        success: false,
        error: new ProtocolError(protocolName, 'Operation failed', error as Error),
        protocol: protocolName
      }
    }
  }

  /**
   * Выполняет операции параллельно с ограничением по времени
   */
  private async executeInParallel<T>(operations: Promise<ProtocolResult<T>>[]): Promise<ProtocolResult<T>[]> {
    return Promise.allSettled(operations).then(results => 
      results.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : {
              success: false,
              error: new ProtocolError('unknown', 'Promise rejected', result.reason),
              protocol: 'unknown'
            }
      )
    )
  }
}

// Создаем глобальный экземпляр реестра
export const protocolRegistry = new ProtocolRegistry()
