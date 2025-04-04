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