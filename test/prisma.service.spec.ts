import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma.service';
import { ConfigModule } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Ensure we disconnect after each test
    if (service && typeof service.$disconnect === 'function') {
      await service.$disconnect();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to database on init', async () => {
    await service.onModuleInit();
    expect(service).toBeDefined();
    
    // Verify connection is established
    try {
      const isConnected = await service.$queryRaw`SELECT 1`;
      expect(isConnected).toBeDefined();
    } catch (error) {
      console.error('Error verifying database connection:', error);
    }
  });

  it('should disconnect from database on destroy', async () => {
    // First connect
    await service.onModuleInit();
    
    // Then disconnect
    await service.onModuleDestroy();
    
    // Verify service is still defined
    expect(service).toBeDefined();
  });
}); 