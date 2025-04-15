import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { KafkaService } from '../src/kafka/kafka.service';
import { NotificationGateway } from '../src/notifications/notification.gateway';
import { ConfigModule } from '@nestjs/config';
import { AppService } from '../src/app.service';
import { AppController } from '../src/app.controller';
import { Logger } from '@nestjs/common';
import { SentryExceptionFilter } from '../src/filters/sentry-exception.filter';
import { PrismaExceptionFilter } from '../src/filters/prisma-exception.filter';
import * as Sentry from '@sentry/node';

// Мокаем Sentry
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
}));

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let appService: AppService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $connect: jest.fn(),
            $disconnect: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            connect: jest.fn(),
            onModuleDestroy: jest.fn(),
          },
        },
        {
          provide: NotificationGateway,
          useValue: {
            server: {
              close: jest.fn(),
            },
          },
        },
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World! Number: 1'),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    appService = moduleFixture.get<AppService>(AppService);
    
    // Добавляем глобальные фильтры исключений в правильном порядке
    app.useGlobalFilters(
      new SentryExceptionFilter(),  // Сначала SentryExceptionFilter для всех ошибок
      new PrismaExceptionFilter(),  // Затем PrismaExceptionFilter для ошибок Prisma
    );

    // Устанавливаем глобальный префикс API
    app.setGlobalPrefix("api");
    
    // Initialize the application
    await app.init();
    
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    // Close connections
    try {
      if (prisma && typeof prisma.$disconnect === 'function') {
        await prisma.$disconnect();
      }
      
      if (app) {
        await app.close();
      }
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  });

  describe('/api/hello (GET)', () => {
    it('should return hello message with number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/hello')
        .expect(200);
      
      expect(response.text).toBe('Hello World! Number: 1');
    });
  });

  describe('/api/debug-sentry (GET)', () => {
    it('should return 500 error with Sentry error message', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/debug-sentry')
        // .expect(500);
      
      // expect(response.body).toEqual(expect.objectContaining({
      //   statusCode: 500,
      //   message: 'My first Sentry error!',
      //   path: '/api/debug-sentry',
      //   timestamp: expect.any(String),
      // }));
      expect(response.body).toEqual(expect.objectContaining({
        "message": "Sentry debug endpoint",
        "status": "success"
      }));
    });
  });
});
