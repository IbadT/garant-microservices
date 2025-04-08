# Создается неправильные дирректории для dist/proto
проверить с базой данных



# garant-microservices
"build": "nest build",

# Garant Microservices

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

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd garant-microservices
```

2. Install dependencies and setup the development environment:
```bash
make dev-setup
```

3. Start the PostgreSQL database:
```bash
make db-up
```

4. Start Kafka and Zookeeper:
```bash
make kafka-up
```

5. Start the application in development mode:
```bash
make run
```

The application will be available at:
- HTTP API: http://localhost:4200
- gRPC: localhost:50051

### Testing gRPC Client

To test the gRPC communication:

1. Make sure the main application is running:
```bash
make run
```

2. In a new terminal, run the gRPC test client:
```bash
make test-grpc
```

The test client will send a request to the gRPC server and display the response.

### Docker Setup

1. Build the Docker containers:
```bash
make docker-build
```

2. Start the containers:
```bash
make docker-up
```

3. View the logs:
```bash
make docker-logs
```

4. Stop the containers:
```bash
make docker-down
```

### Proto File Generation

The project uses Protocol Buffers for gRPC communication. To generate the proto files:

```bash
make proto-gen
```

For development with auto-generation on changes:
```bash
make proto-watch
```

### Database Management

1. Start the PostgreSQL database:
```bash
make db-up
```

2. Stop the PostgreSQL database:
```bash
make db-down
```

3. Generate Prisma client:
```bash
make db-generate
```

4. Run database migrations:
```bash
make db-migrate
```

### Kafka Management

1. Start Kafka and Zookeeper:
```bash
make kafka-up
```

2. Stop Kafka and Zookeeper:
```bash
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