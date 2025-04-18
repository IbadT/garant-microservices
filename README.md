# garant-microservices
"build": "nest build",

# Garant Microservices

```

## make all
## make run

### OR

## make install
## make build
## make run

```


This project is a microservices-based application built with NestJS, gRPC, and Docker.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Make](https://www.gnu.org/software/make/)

## Project Structure

```
.
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── test-grpc.ts
│   └── proto/
│       └── garant.proto
├── Dockerfile
├── docker-compose.yml
├── docker-compose.db.yml
├── docker-compose.kafka.yml
├── Makefile
└── package.json
```

## Getting Started

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```env
# Application
PORT=4201
NODE_ENV=develop

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/garant?schema=public"

# Kafka
KAFKA_BROKER=localhost:29092

# gRPC
GRPC_URL=localhost:50051
FRONTEND_URL=http://localhost:3000

# Services
DEALS_SERVICE_URL=localhost:50051
DISPUTES_SERVICE_URL=localhost:50051

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Other
KAFKAJS_NO_PARTITIONER_WARNING=1
```

### Quick Start

1. Setup the development environment:
```bash
make dev-setup
```
This command will:
- Install dependencies
- Generate proto files
- Build the application

2. Start the application:
```bash
make run
```
This command will:
- Start the PostgreSQL database
- Start Kafka and Zookeeper
- Wait for services to be ready
- Run database migrations
- Start the application in development mode
- Watch for proto file changes

The application will be available at:
- HTTP API: http://localhost:4201 (or PORT from .env)
- gRPC: localhost:50051 (or GRPC_URL from .env)

### Manual Setup (Alternative)

If you prefer to start services manually:

1. Start the database:
```bash
make db-up
```

2. Start Kafka:
```bash
make kafka-up
```

3. Run database migrations:
```bash
make db-migrate
```

4. Start the application:
```bash
npm run start:dev
```

### Testing

1. Run the test suite:
```bash
make test
```

2. Run tests with coverage:
```bash
make test-cov
```

3. Test gRPC communication:
```bash
make test-grpc
```

### Development Commands

- Format code:
```bash
make format
```

- Run linter:
```bash
make lint
```

- Generate proto files:
```bash
make proto-gen
```

- Watch proto files for changes:
```bash
make proto-watch
```

### Database Management

- Create a new migration:
```bash
make db-migrate-create
```

- Apply migrations:
```bash
make db-migrate
```

- Generate Prisma client:
```bash
make db-generate
```

- Seed the database:
```bash
make db-seed
```

### Docker Commands

- Build containers:
```bash
make docker-build
```

- Start containers:
```bash
make docker-up
```

- Stop containers:
```bash
make docker-down
```

- View logs:
```bash
make docker-logs
```

### Cleanup

- Clean build artifacts:
```bash
make clean
```

- Stop all services:
```bash
make db-down
make kafka-down
```

## Available Make Commands

- `make install` - Install dependencies
- `make build` - Build the application
- `make run` - Run the application in development mode
- `make test` - Run tests
- `make test-cov` - Run tests with coverage
- `make test-grpc` - Run gRPC test client
- `make clean` - Clean build artifacts
- `make docker-build` - Build Docker containers
- `make docker-up` - Start Docker containers
- `make docker-down` - Stop Docker containers
- `make docker-logs` - View Docker container logs
- `make db-up` - Start PostgreSQL database
- `make db-down` - Stop PostgreSQL database
- `make kafka-up` - Start Kafka and Zookeeper
- `make kafka-down` - Stop Kafka and Zookeeper
- `make proto-gen` - Generate proto files
- `make proto-watch` - Watch and generate proto files
- `make lint` - Run linter
- `make format` - Format code
- `make db-migrate` - Run database migrations
- `make db-generate` - Generate Prisma client
- `make dev-setup` - Setup development environment
- `make prod-setup` - Setup production environment

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
PORT=4200
GRPC_PORT=50051
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/garant?schema=public"

# Kafka
KAFKA_BROKER="localhost:29092"
```

## Testing

Run the test suite:
```bash
make test
```

Run tests with coverage:
```bash
make test-cov
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

[Your License Here]

# Garant Microservices - Система обработки сделок

## Обзор

Эта система реализует безопасный сервис условного депонирования (escrow) для обработки транзакций между покупателями и продавцами. Она гарантирует, что средства правильно удерживаются, освобождаются и переводятся на основе соглашения между сторонами и результата любых споров.

## Механика обработки сделок

### 1. Сделки, инициированные покупателем

#### Создание сделки
- Покупатель инициирует сделку, предлагая транзакцию
- Система автоматически помещает средства на **удержание** (резервирует) со счета покупателя
- Статус сделки устанавливается в `PENDING` (ОЖИДАНИЕ)

#### Принятие сделки продавцом
- Если продавец принимает сделку:
  - Статус сделки меняется на `ACTIVE` (АКТИВНАЯ)
  - Для автоматических сделок комиссия проекта возвращается
  - Покупатель может подтвердить выполнение работы, что освобождает средства продавцу
  - Покупатель может открыть спор, если недоволен

#### Отмена/отклонение сделки
- Если покупатель отменяет сделку до принятия продавцом:
  - Средства возвращаются покупателю
  - Только покупатель может оставить отзыв
- Если продавец отклоняет сделку:
  - Средства возвращаются покупателю
  - Только покупатель может оставить отзыв
- Если продавец отменяет сделку после принятия:
  - Средства возвращаются покупателю
  - Только покупатель может оставить отзыв

### 2. Сделки, инициированные продавцом

#### Создание сделки
- Продавец инициирует сделку, предлагая транзакцию
- На этом этапе средства не резервируются
- Статус сделки устанавливается в `PENDING` (ОЖИДАНИЕ)

#### Принятие сделки покупателем
- Если покупатель принимает сделку:
  - Средства помещаются на **удержание** со счета покупателя
  - Статус сделки меняется на `ACTIVE` (АКТИВНАЯ)
  - Для автоматических сделок комиссия проекта возвращается
  - Покупатель может подтвердить выполнение работы, что освобождает средства продавцу
  - Покупатель может открыть спор, если недоволен

#### Автоматическое принятие
- Если покупатель не отвечает в течение 24 часов:
  - Сделка автоматически принимается
  - Средства помещаются на **удержание** со счета покупателя
  - Статус сделки меняется на `ACTIVE` (АКТИВНАЯ)
  - Дальнейшие условия аналогичны ручному принятию

#### Отмена/отклонение сделки
- Если покупатель отклоняет сделку:
  - Сделка отменяется
  - Только покупатель может оставить отзыв
- Если продавец отменяет сделку до принятия покупателем:
  - Сделка отменяется
  - Только покупатель может оставить отзыв

### 3. Обработка споров

#### Открытие спора
- Любая из сторон может открыть спор
- Статус сделки меняется на `DISPUTED` (ОСПАРИВАЕМАЯ)
- Средства остаются на удержании до разрешения спора

#### Разрешение спора
- Модератор рассматривает спор и принимает решение
- Если побеждает продавец:
  - Средства переводятся продавцу
  - Статус сделки меняется на `COMPLETED` (ЗАВЕРШЕНА)
- Если побеждает покупатель:
  - Средства возвращаются покупателю
  - Статус сделки меняется на `COMPLETED` (ЗАВЕРШЕНА)

#### Отзывы
- Только покупатель может оставить отзыв о сделке, независимо от результата

## Техническая реализация

### Ключевые компоненты

1. **DealService**: Основная бизнес-логика для обработки сделок
   - Обрабатывает создание, принятие, отмену и завершение сделок
   - Управляет резервированием и переводом средств
   - Реализует автоматическое принятие для сделок, инициированных продавцом
   - Обрабатывает споры и их разрешение

2. **DealController**: gRPC API endpoints
   - Предоставляет методы для всех операций со сделками
   - Проверяет входные данные
   - Обрабатывает ответы с ошибками

3. **Модели данных**:
   - Deal: Представляет транзакцию между покупателем и продавцом
   - Dispute: Представляет конфликт, требующий разрешения
   - User: Содержит информацию о балансе и зарезервированном балансе

### Поток статусов сделки

```
PENDING → ACTIVE → COMPLETED
     ↓         ↓
  DECLINED  DISPUTED
     ↓         ↓
  CANCELLED  COMPLETED
```

### Обработка средств

1. **Резервирование**: Когда средства помещаются на удержание
   - Баланс покупателя уменьшается
   - Зарезервированный баланс покупателя увеличивается

2. **Освобождение**: Когда средства возвращаются покупателю
   - Зарезервированный баланс покупателя уменьшается
   - Баланс покупателя увеличивается

3. **Перевод**: Когда средства отправляются продавцу
   - Зарезервированный баланс покупателя уменьшается
   - Баланс продавца увеличивается

### Механизм автоматического принятия

- Система проверяет каждые 5 минут сделки, инициированные продавцом, находящиеся в ожидании
- Если сделка старше 24 часов, она автоматически принимается
- Средства покупателя резервируются
- Уведомления отправляются обеим сторонам

### Процесс разрешения спора

1. Любая из сторон открывает спор с указанием причины
2. Модератор рассматривает спор
3. Модератор принимает решение (CUSTOMER_WIN или VENDOR_WIN)
4. Система автоматически обрабатывает перевод средств на основе решения
5. Сделка отмечается как завершенная
6. Только покупатель может оставить отзыв

## API Endpoints

### Операции со сделками
- `CreateDeal`: Создать новую сделку (инициированную покупателем или продавцом)
- `AcceptDeal`: Принять ожидающую сделку
- `DeclineDeal`: Отклонить ожидающую сделку
- `CancelDeal`: Отменить сделку
- `ConfirmCompletion`: Подтвердить выполнение работы и освободить средства

### Операции со спорами
- `OpenDealDispute`: Открыть спор по сделке
- `ResolveDealDispute`: Разрешить спор (только для модераторов)

### Операции запросов
- `GetActiveDeals`: Получить все активные сделки для пользователя
- `GetDealById`: Получить конкретную сделку по ID

## Соображения безопасности

- Все операции выполняются в рамках транзакций базы данных
- Переводы средств являются атомарными операциями
- Контроль доступа на основе ролей для разрешения споров
- Проверка входных данных для всех API endpoints
- Правильная обработка ошибок и логирование

## Система уведомлений

- Уведомления отправляются при всех значимых изменениях состояния:
  - Создание сделки
  - Принятие сделки
  - Отмена/отклонение сделки
  - Открытие спора
  - Разрешение спора
  - Завершение работы

## Система событий

- События Kafka публикуются при всех значимых изменениях состояния
- События могут быть обработаны другими микросервисами для интеграции

## Система комиссий

### Общее описание
Система комиссий взимает плату с покупателя при создании или принятии сделки. Комиссия рассчитывается как процент от суммы сделки, но не менее установленной минимальной суммы.

### Настройка комиссий
- Процент комиссии и минимальная сумма настраиваются через админ-панель
- Настройки хранятся в таблице `commission_settings`
- Активными считаются только последние установленные настройки

### Расчет комиссии
Комиссия рассчитывается по формуле:
```
commission = max(deal_amount * percentage / 100, min_amount)
```
где:
- `deal_amount` - сумма сделки
- `percentage` - процент комиссии
- `min_amount` - минимальная сумма комиссии

### Моменты взимания комиссии
Комиссия взимается в следующих случаях:
1. Когда покупатель создает сделку:
   - Сразу удерживается сумма сделки + комиссия
   - Комиссия переводится на системный баланс
   - Сделка создается со статусом `commission_paid = true`

2. Когда покупатель принимает сделку, созданную продавцом:
   - При принятии удерживается сумма сделки + комиссия
   - Комиссия переводится на системный баланс
   - Сделка обновляется со статусом `commission_paid = true`

### Возврат комиссии
Комиссия возвращается в следующих случаях:
1. Покупатель отменяет свою сделку до принятия продавцом
2. Продавец отклоняет сделку
3. Сделка автоматически отменяется по таймауту (30 минут)

### Системный баланс комиссий
- Все комиссии накапливаются на отдельном балансе системы
- Баланс доступен для просмотра в админ-панели
- Баланс уменьшается при выводе средств администратором

### Автоматическая отмена сделок
- Система проверяет каждые 5 минут сделки в статусе `PENDING`
- Если сделка не была принята в течение 30 минут, она автоматически отменяется
- При автоматической отмене:
  - Возвращается комиссия (если была уплачена)
  - Возвращаются зарезервированные средства (если были)
  - Сделка получает статус `CANCELLED` с пометкой `cancelled_by = 'SYSTEM'`

### Безопасность
- Все операции с комиссиями выполняются в рамках транзакций
- Комиссии не могут быть изменены после создания сделки
- Возврат комиссии происходит автоматически при отмене/отклонении сделки
- Системный баланс комиссий защищен от несанкционированного доступа

## Детальное описание полей таблиц комиссий

### Таблица `commission_settings` (Настройки комиссий)

| Поле | Тип | Описание |
|------|-----|----------|
| id | String | Уникальный идентификатор записи настроек |
| percentage | Float | Процент комиссии от суммы сделки (например, 5.0 для 5%) |
| min_amount | Float | Минимальная сумма комиссии в рублях, которая будет взиматься даже если процентная комиссия меньше |
| created_at | DateTime | Дата и время создания записи настроек |
| updated_at | DateTime | Дата и время последнего обновления записи |
| is_active | Boolean | Флаг активности настроек (true - текущие настройки, false - исторические) |

### Таблица `commission_balance` (Баланс комиссий)

| Поле | Тип | Описание |
|------|-----|----------|
| id | String | Уникальный идентификатор записи баланса |
| amount | Float | Текущая сумма накопленных комиссий в рублях |
| created_at | DateTime | Дата и время создания записи баланса |
| updated_at | DateTime | Дата и время последнего обновления суммы баланса |

### Дополнительные поля в таблице `deals` (Сделки)

| Поле | Тип | Описание |
|------|-----|----------|
| commission_amount | Float | Сумма комиссии по данной сделке в рублях |
| commission_paid | Boolean | Флаг, указывающий была ли уплачена комиссия (true - уплачена, false - не уплачена или возвращена) |
