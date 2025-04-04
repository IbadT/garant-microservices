.PHONY: build run test clean docker-build docker-up docker-down docker-logs proto-gen proto-watch install lint format

# Default target
all: install build

# Install dependencies
install:
	npm install

# Build the application
build:
	npm run build

# Run the application in development mode
run:
	npm run dev

# Run tests
test:
	npm run test

# Run tests with coverage
test-cov:
	npm run test:cov

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf coverage

# Docker commands
docker-build:
	docker-compose build --no-cache

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Proto commands
proto-gen:
	npm run proto:gen

proto-watch:
	npm run proto:watch

# Linting and formatting
lint:
	npm run lint

format:
	npm run format

# Database commands
db-migrate:
	npx prisma migrate deploy

db-generate:
	npx prisma generate

# Development setup
dev-setup: install proto-gen build

# Production setup
prod-setup: install proto-gen build

# Help command
help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make build        - Build the application"
	@echo "  make run          - Run the application in development mode"
	@echo "  make test         - Run tests"
	@echo "  make test-cov     - Run tests with coverage"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-build - Build Docker containers"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs  - View Docker container logs"
	@echo "  make proto-gen    - Generate proto files"
	@echo "  make proto-watch  - Watch and generate proto files"
	@echo "  make lint         - Run linter"
	@echo "  make format       - Format code"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-generate  - Generate Prisma client"
	@echo "  make dev-setup    - Setup development environment"
	@echo "  make prod-setup   - Setup production environment" 