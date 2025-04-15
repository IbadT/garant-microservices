import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env.test' });

// Create a global Prisma client for tests
const prisma = new PrismaClient();

// Connect to the database
beforeAll(async () => {
  await prisma.$connect();
});

// Disconnect from the database
afterAll(async () => {
  await prisma.$disconnect();
});

// Clean up the database after each test
afterEach(async () => {
  const tables = ['users', 'deals', 'disputes', 'reviews', 'commission_settings', 'commission_balance'];
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (error) {
      console.error(`Error truncating table ${table}:`, error);
    }
  }
});

// Mock Kafka service
jest.mock('../src/kafka/kafka.service', () => {
  return {
    KafkaService: jest.fn().mockImplementation(() => ({
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      subscribeToDealUpdates: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock NotificationService
jest.mock('../src/notifications/notification.service', () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => ({
      sendNotification: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock NotificationGateway
jest.mock('../src/notifications/notification.gateway', () => {
  return {
    NotificationGateway: jest.fn().mockImplementation(() => ({
      handleConnection: jest.fn(),
      handleDisconnect: jest.fn(),
      sendNotification: jest.fn(),
    })),
  };
});

// Increase timeout for all tests
jest.setTimeout(30000); 