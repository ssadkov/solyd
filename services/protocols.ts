import { protocolRegistry } from './protocol-registry'
import { jupiterService } from './jupiter.service'

// Регистрируем все доступные протоколы
export function initializeProtocols(): void {
  // Регистрируем Jupiter Lend
  protocolRegistry.register(jupiterService)
  
  // Здесь можно будет добавить другие протоколы в будущем
  // protocolRegistry.register(new SolendService())
  // protocolRegistry.register(new MangoService())
  
  console.log('Protocols initialized successfully')
}

// Экспортируем реестр для использования в приложении
export { protocolRegistry }
export { jupiterService }
