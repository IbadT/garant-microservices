import { Test, TestingModule } from '@nestjs/testing';
import { DealService } from './deal.service';
import { PrismaService } from 'src/prisma.service';
import { KafkaService } from 'src/kafka/kafka.service';
import { NotificationService } from 'src/notifications/notification.service';
import { BadRequestException } from '@nestjs/common';
import { DealStatus, DealInitiator, DisputeStatus } from '@prisma/client';

describe('DealService', () => {
  let service: DealService;
  let prismaService: PrismaService;
  let kafkaService: KafkaService;
  let notificationService: NotificationService;

  const mockDeal = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    status: DealStatus.PENDING,
    customer_id: '123e4567-e89b-12d3-a456-426614174001',
    vendor_id: '123e4567-e89b-12d3-a456-426614174002',
    amount: 100,
    description: 'Test deal',
    initiator: DealInitiator.CUSTOMER,
    funds_reserved: true,
    disputes: [],
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    balance: 1000,
    reserved_balance: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation((callback) => callback({
              deal: {
                create: jest.fn().mockResolvedValue(mockDeal),
                findUnique: jest.fn().mockResolvedValue(mockDeal),
                update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockDeal, ...data })),
                findMany: jest.fn().mockResolvedValue([mockDeal]),
              },
              user: {
                findUnique: jest.fn().mockResolvedValue(mockUser),
                update: jest.fn().mockResolvedValue({ ...mockUser, balance: 900, reserved_balance: 100 }),
              },
              dispute: {
                create: jest.fn().mockResolvedValue({ 
                  id: '123e4567-e89b-12d3-a456-426614174003', 
                  deal_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: DisputeStatus.PENDING,
                }),
              },
            })),
            deal: {
              findMany: jest.fn().mockResolvedValue([mockDeal]),
              findUnique: jest.fn().mockResolvedValue(mockDeal),
            },
          },
        },
        {
          provide: KafkaService,
          useValue: {
            sendDealEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            notifyUser: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DealService>(DealService);
    prismaService = module.get<PrismaService>(PrismaService);
    kafkaService = module.get<KafkaService>(KafkaService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDeal', () => {
    it('should create a deal successfully when customer is initiator', async () => {
      const createDealRequest = {
        initiatorId: '123e4567-e89b-12d3-a456-426614174001',
        targetId: '123e4567-e89b-12d3-a456-426614174002',
        amount: 100,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      const result = await service.createDeal(createDealRequest);
      expect(result).toEqual(mockDeal);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user not found', async () => {
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        deal: {
          create: jest.fn(),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));
      
      prismaService.$transaction = mockTransaction;

      const createDealRequest = {
        initiatorId: '123e4567-e89b-12d3-a456-426614174009',
        targetId: '123e4567-e89b-12d3-a456-426614174002',
        amount: 100,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      await expect(service.createDeal(createDealRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when insufficient funds', async () => {
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        deal: {
          create: jest.fn(),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ ...mockUser, balance: 50 }),
        },
      }));
      
      prismaService.$transaction = mockTransaction;

      const createDealRequest = {
        initiatorId: '123e4567-e89b-12d3-a456-426614174001',
        targetId: '123e4567-e89b-12d3-a456-426614174002',
        amount: 100,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      await expect(service.createDeal(createDealRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('declineDeal', () => {
    it('should decline a deal successfully', async () => {
      const result = await service.declineDeal('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174002');
      expect(result.status).toBe(DealStatus.DECLINED);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));
      
      prismaService.$transaction = mockTransaction;

      await expect(service.declineDeal('123e4567-e89b-12d3-a456-426614174009', '123e4567-e89b-12d3-a456-426614174002')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelDeal', () => {
    it('should cancel a deal successfully', async () => {
      const result = await service.cancelDeal('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001');
      expect(result.status).toBe(DealStatus.CANCELLED);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));
      
      prismaService.$transaction = mockTransaction;

      await expect(service.cancelDeal('123e4567-e89b-12d3-a456-426614174009', '123e4567-e89b-12d3-a456-426614174001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('openDispute', () => {
    it('should open a dispute successfully', async () => {
      const result = await service.openDispute('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 'Test reason');
      expect(result.deal.status).toBe(DealStatus.DISPUTED);
      expect(result.dispute).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));
      
      prismaService.$transaction = mockTransaction;

      await expect(service.openDispute('123e4567-e89b-12d3-a456-426614174009', '123e4567-e89b-12d3-a456-426614174001', 'Test reason')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when dispute already exists', async () => {
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            disputes: [{ status: DisputeStatus.PENDING }],
          }),
        },
      }));
      
      prismaService.$transaction = mockTransaction;

      await expect(service.openDispute('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001', 'Test reason')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveDeals', () => {
    it('should get active deals successfully', async () => {
      const result = await service.getActiveDeals('123e4567-e89b-12d3-a456-426614174001');
      expect(Array.isArray(result)).toBe(true);
      expect(prismaService.deal.findMany).toHaveBeenCalled();
    });
  });

  describe('getDealById', () => {
    it('should get deal by id successfully', async () => {
      const result = await service.getDealById('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockDeal);
      expect(prismaService.deal.findUnique).toHaveBeenCalled();
    });
  });
}); 