import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  beforeAll(async () => {
    // Создаем мок для PrismaService с нужной нам функциональностью
    const mockPrismaService = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        create: jest.fn().mockImplementation(async (data) => {
          return {
            id: 1,
            ...data.data,
          };
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockImplementation(async (args) => {
          if (args.where.email === 'test@example.com') {
            return {
              id: 1,
              email: 'test@example.com',
              password: await bcrypt.hash('password123', 10),
              role: 'CUSTOMER',
              balance: 1000,
              reserved_balance: 0,
            };
          }
          return null;
        }),
      },
    };

    // Создаем мок для JwtService
    const mockJwtService = {
      sign: jest.fn().mockReturnValue('test-token'),
    };

    // Создаем мок для ConfigService
    const mockConfigService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'JWT_SECRET') {
          return 'test-secret-key';
        }
        return undefined;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PassportModule,
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'JWT_MODULE_OPTIONS',
          useValue: {
            secret: 'test-secret-key',
            signOptions: { expiresIn: '1h' },
          },
        },
        {
          provide: 'JwtService',
          useValue: mockJwtService,
        },
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn().mockImplementation(async (email, password) => {
              if (email === 'test@example.com' && password === 'password123') {
                return {
                  id: 1,
                  email: 'test@example.com',
                  role: 'CUSTOMER',
                  balance: 1000,
                  reserved_balance: 0,
                };
              }
              return null;
            }),
            login: jest.fn().mockImplementation(async (loginDto) => {
              if (!loginDto || !loginDto.email || !loginDto.password) {
                throw new Error('Email and password are required');
              }
              
              const user = await moduleFixture.get(AuthService).validateUser(loginDto.email, loginDto.password);
              if (!user) {
                throw new Error('Invalid credentials');
              }
              
              return {
                access_token: 'test-token',
              };
            }),
          },
        },
        {
          provide: JwtStrategy,
          useValue: {
            validate: jest.fn().mockImplementation((payload) => ({
              userId: payload.sub,
              email: payload.email,
              role: payload.role,
            })),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: RolesGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);
    
    // Initialize the application
    await app.init();
    
    // Ensure database connection is established
    await prisma.$connect();

    // Create test user
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          role: 'CUSTOMER',
          balance: 1000,
          reserved_balance: 0,
        },
      });
    } catch (error) {
      console.error('Error creating test user:', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (prisma && prisma.user) {
        await prisma.user.deleteMany({
          where: {
            email: 'test@example.com',
          },
        });
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
    
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

  describe('/auth/login (POST)', () => {
    it('should return access token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 400 for missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });
}); 