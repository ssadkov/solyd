# SolYd - Центр управления доходностью в DeFi на Solana

<div align="center">
  <img src="public/solyd_logo_gor.jpg" alt="SolYd Logo" width="200" height="200">
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Solana](https://img.shields.io/badge/Solana-Web3.js-purple?style=for-the-badge&logo=solana)](https://solana.com/)
  [![Jupiter](https://img.shields.io/badge/Jupiter-API-orange?style=for-the-badge)](https://jup.ag/)
</div>

## 🚀 О проекте

**SolYd** — это современный DeFi дашборд для экосистемы Solana, который предоставляет пользователям единую точку входа для управления доходностью своих активов. Платформа агрегирует возможности различных протоколов DeFi, позволяя пользователям легко находить, сравнивать и участвовать в наиболее выгодных инвестиционных стратегиях.

### ✨ Ключевые возможности

- 🔍 **Агрегация возможностей** - Объединение данных от различных DeFi протоколов в едином интерфейсе
- 💰 **Управление позициями** - Отслеживание активных инвестиций и их доходности
- 🔄 **Интегрированный свап** - Обмен токенов с последующим автоматическим депозитом
- 📊 **Аналитика доходности** - Детальная статистика по заработку и APY
- 🎯 **Умные рекомендации** - Персонализированные предложения на основе портфеля
- 📱 **Адаптивный дизайн** - Полная поддержка мобильных устройств
- 🔐 **Безопасность** - Интеграция с популярными Solana кошельками

## 🏗️ Техническая архитектура

### Frontend Stack

- **Next.js 15.5.2** - React фреймворк с App Router
- **React 19.1.0** - Современная библиотека для UI
- **TypeScript 5.0** - Типизированный JavaScript
- **Tailwind CSS 4.0** - Utility-first CSS фреймворк
- **Radix UI** - Доступные компоненты интерфейса
- **Recharts** - Библиотека для графиков и диаграмм

### Blockchain Integration

- **@solana/web3.js** - Основная библиотека для работы с Solana
- **@solana/wallet-adapter** - Интеграция с кошельками
- **Jupiter API** - Маршрутизация и обмен токенов
- **SPL Token** - Работа с токенами Solana

### Архитектурные паттерны

- **Модульная архитектура** - Разделение на сервисы, хуки и компоненты
- **Protocol Registry** - Единая система управления DeFi протоколами
- **Custom Hooks** - Переиспользуемая бизнес-логика
- **Type Safety** - Полная типизация всех интерфейсов

## 📁 Структура проекта

```
solyd/
├── app/                          # Next.js App Router
│   ├── api/                      # API маршруты
│   │   ├── aggregator/           # Агрегация данных протоколов
│   │   ├── jupiter/              # Jupiter API интеграция
│   │   └── user-positions/       # Позиции пользователя
│   ├── dashboard/                # Главная страница дашборда
│   └── aggregator/               # Страница агрегатора
├── components/                   # React компоненты
│   ├── ui/                       # Базовые UI компоненты
│   ├── aggregator/               # Компоненты агрегатора
│   ├── layout/                   # Компоненты макета
│   └── enhanced-opportunity-card.tsx
├── hooks/                        # Custom React хуки
│   ├── use-aggregator-data.ts    # Данные агрегатора
│   ├── use-enhanced-opportunities.ts
│   ├── use-earnings.ts          # Расчет доходности
│   └── use-swap.ts              # Логика обмена
├── services/                     # Бизнес-логика
│   ├── jupiter.service.ts        # Jupiter API сервис
│   ├── protocol-registry.ts      # Реестр протоколов
│   └── jupiter-price.service.ts  # Ценовые данные
├── types/                        # TypeScript типы
│   ├── aggregator.ts            # Типы агрегатора
│   ├── jupiter.ts               # Jupiter API типы
│   └── protocol.ts              # Базовые типы протоколов
└── contexts/                     # React контексты
    └── wallet-context.tsx        # Контекст кошелька
```

## 🔧 Установка и запуск

### Предварительные требования

- Node.js 18+ 
- npm или yarn
- Solana кошелек (Phantom, Solflare, Backpack)

### Установка зависимостей

```bash
npm install
# или
yarn install
```

### Настройка окружения

Создайте файл `.env.local` в корне проекта:

```env
# Solana RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# Jupiter API
NEXT_PUBLIC_JUPITER_API_URL=https://quote-api.jup.ag/v6
NEXT_PUBLIC_JUPITER_LITE_API_URL=https://lite-api.jup.ag

# Дополнительные настройки
NEXT_PUBLIC_APP_NAME=SolYd
NEXT_PUBLIC_APP_DESCRIPTION=DeFi Dashboard for Solana
```

### Запуск в режиме разработки

```bash
npm run dev
# или
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Сборка для продакшена

```bash
npm run build
npm start
# или
yarn build
yarn start
```

## 🎯 Основные функции

### 1. Агрегация DeFi возможностей

Платформа собирает данные от различных протоколов DeFi и представляет их в едином интерфейсе:

- **Jupiter Lend** - Протокол кредитования
- **Orca** - AMM протокол (планируется)
- **Raydium** - AMM и фарминг (планируется)
- **Marinade** - Стейкинг SOL (планируется)

### 2. Управление позициями

- Отслеживание активных инвестиций
- Расчет доходности в реальном времени
- История транзакций
- Возможность пополнения и вывода средств

### 3. Интегрированный свап

- Обмен токенов через Jupiter API
- Автоматический депозит после свапа
- Оптимизация маршрутов для лучших курсов
- Защита от проскальзывания

### 4. Аналитика и отчеты

- Общая доходность портфеля
- Детализация по каждому протоколу
- Исторические данные
- Прогнозы доходности

## 🔌 API Endpoints

### Агрегатор данных

```typescript
GET /api/aggregator
// Возвращает все доступные возможности DeFi
```

### Позиции пользователя

```typescript
GET /api/user-positions?address={walletAddress}
// Возвращает активные позиции пользователя
```

### Jupiter интеграция

```typescript
GET /api/jupiter/earnings?address={walletAddress}&positions={positions}
// Возвращает данные о заработке
```

## 🎨 UI/UX особенности

### Дизайн система

- **Темная/светлая тема** - Автоматическое переключение
- **Адаптивность** - Полная поддержка мобильных устройств
- **Accessibility** - Соответствие стандартам доступности
- **Анимации** - Плавные переходы и микроинтеракции

### Компоненты

- **Enhanced Opportunity Card** - Карточки инвестиционных возможностей
- **Swap Modal** - Модальное окно для обмена токенов
- **Wallet Connect** - Интеграция с кошельками
- **Data Table** - Таблицы с данными и сортировкой

## 🔒 Безопасность

- **Wallet Integration** - Безопасное подключение кошельков
- **Transaction Signing** - Подписание транзакций в кошельке
- **Input Validation** - Валидация всех пользовательских данных
- **Error Handling** - Обработка ошибок и исключений

## 🚀 Развертывание

### Vercel (рекомендуется)

1. Подключите репозиторий к Vercel
2. Настройте переменные окружения
3. Деплой автоматически при push в main

### Docker

```bash
# Сборка образа
docker build -t solyd .

# Запуск контейнера
docker run -p 3000:3000 solyd
```

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие SolYd! Пожалуйста, следуйте этим шагам:

1. Форкните репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Стандарты кода

- Используйте TypeScript для всех новых файлов
- Следуйте ESLint правилам
- Покрывайте тестами новую функциональность
- Документируйте публичные API

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🙏 Благодарности

- [Solana Labs](https://solana.com/) - За экосистему Solana
- [Jupiter](https://jup.ag/) - За API для обмена токенов
- [Next.js](https://nextjs.org/) - За отличный React фреймворк
- [Radix UI](https://www.radix-ui.com/) - За доступные компоненты

## 📞 Поддержка

- **Email**: mail@sheremetev.info
- **GitHub Issues**: [Сообщить о проблеме](https://github.com/solyd/solyd/issues)

---

<div align="center">
  <p>Сделано с ❤️ для экосистемы Solana</p>
  <p>© 2024 SolYd. Все права защищены.</p>
</div>