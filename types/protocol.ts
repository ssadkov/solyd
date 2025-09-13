import { AggregatorData } from './aggregator'

// Базовые типы для пользовательских позиций
export interface UserPosition {
  id: string
  protocol: string
  tokenAddress: string
  tokenSymbol: string
  tokenName: string
  tokenLogo?: string
  shares: string
  underlyingAssets: string
  underlyingBalance: string
  apy: number
  totalValue: number
  withdrawable: string
  lastUpdated: string
  // Дополнительные поля для Jupiter
  jupiterTokenAddress?: string // Адрес Jupiter токена для earnings API
}

// Интерфейс для транзакций
export interface ProtocolTransaction {
  id: string
  type: 'supply' | 'withdraw' | 'claim_rewards'
  tokenAddress: string
  amount: string
  signature?: string
  status: 'pending' | 'success' | 'failed'
  timestamp: string
}

// Базовый интерфейс для всех протоколов
export interface ProtocolService {
  // Метаданные протокола
  name: string
  category: 'lending' | 'rewards' | 'liquidity' | 'staking'
  logo?: string
  
  // Получение общих пулов для агрегатора
  getPools(): Promise<AggregatorData[]>
  
  // Получение позиций пользователя
  getUserPositions(walletAddress: string): Promise<UserPosition[]>
  
  // Действия пользователя
  supply(tokenAddress: string, amount: string, walletAddress: string): Promise<ProtocolTransaction>
  withdraw(positionId: string, amount: string, walletAddress: string): Promise<ProtocolTransaction>
  claimRewards(positionId: string, walletAddress: string): Promise<ProtocolTransaction>
  
  // Проверка доступности
  isAvailable(): Promise<boolean>
}

// Ошибки протоколов
export class ProtocolError extends Error {
  constructor(
    public protocol: string,
    message: string,
    public originalError?: Error
  ) {
    super(`[${protocol}] ${message}`)
    this.name = 'ProtocolError'
  }
}

// Результат выполнения операции с протоколом
export interface ProtocolResult<T> {
  success: boolean
  data?: T
  error?: ProtocolError
  protocol: string
}
