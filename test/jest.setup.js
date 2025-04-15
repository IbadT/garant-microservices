// Mock ConfigModule
jest.mock('@nestjs/config', () => {
  const ConfigService = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((key) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret-key';
      }
      return undefined;
    }),
  }));

  return {
    ConfigModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class ConfigModule {},
        providers: [ConfigService],
        exports: [ConfigService],
      }),
    },
    ConfigService,
  };
});

// Mock PrismaService
jest.mock('../src/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    })),
  };
});

// Mock Kafka service
jest.mock('../src/kafka/kafka.service', () => {
  return {
    KafkaService: jest.fn().mockImplementation(() => ({
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
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
      server: {
        close: jest.fn().mockImplementation((callback) => callback()),
      },
    })),
  };
});

// Mock SentryModule
jest.mock('@sentry/nestjs/setup', () => {
  return {
    SentryModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class SentryModule {},
        providers: [],
        exports: [],
      }),
    },
    SentryGlobalFilter: jest.fn().mockImplementation(() => ({
      catch: jest.fn(),
    })),
  };
});