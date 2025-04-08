import { Test, TestingModule } from '@nestjs/testing';
import { DealService } from './deal.service';
import { PrismaService } from '../prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from '../notifications/notification.service';
import { BadRequestException } from '@nestjs/common';
import { DealStatus, DealInitiator, DisputeStatus, UserRole } from '@prisma/client';

describe('DealService', () => {
  let service: DealService;
  let prismaService: PrismaService;
  let kafkaService: KafkaService;
  let notificationService: NotificationService;

  const mockVendor = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    balance: 1000,
    role: UserRole.VENDOR,
  };

  const mockCustomer = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    balance: 1000,
    role: UserRole.CUSTOMER,
  };

  const mockModerator = {
    id: '123e4567-e89b-12d3-a456-426614174007',
    role: UserRole.MODERATOR,
  };

  const mockDeal = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    vendor_id: mockVendor.id,
    customer_id: mockCustomer.id,
    amount: 100,
    status: DealStatus.PENDING,
    created_at: new Date(),
    updated_at: new Date(),
    completed_at: null,
    disputes: [],
    funds_reserved: false,
    initiator: DealInitiator.CUSTOMER,
    description: 'Test deal',
    accepted_at: null,
    cancelled_at: null,
    cancelled_by: null,
    declined_at: null,
    declined_by: null
  };

  const mockActiveDeal = {
    ...mockDeal,
    status: DealStatus.ACTIVE,
    funds_reserved: true,
    accepted_at: new Date()
  };

  const mockDisputedDeal = {
    ...mockDeal,
    status: DealStatus.DISPUTED,
    funds_reserved: true,
    disputes: [{
      id: '123e4567-e89b-12d3-a456-426614174003',
      deal_id: mockDeal.id,
      status: DisputeStatus.PENDING,
      opened_by: mockCustomer.id,
      opened_by_role: UserRole.CUSTOMER,
      reason: 'Test dispute',
      resolution: null,
      resolved_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    }],
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
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                findMany: jest.fn(),
              },
              user: {
                findUnique: jest.fn(),
                update: jest.fn(),
              },
              dispute: {
                create: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
              },
            })),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            connect: jest.fn(),
            subscribeToDealUpdates: jest.fn(),
            sendDealEvent: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            notifyUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DealService>(DealService);
    prismaService = module.get<PrismaService>(PrismaService);
    kafkaService = module.get<KafkaService>(KafkaService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  describe('createDeal', () => {
    it('should create a deal successfully when customer is initiator', async () => {
      const createDealDto = {
        amount: 100,
        initiatorId: mockCustomer.id,
        targetId: mockVendor.id,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      const mockPrisma = {
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce({ ...mockVendor })
            .mockResolvedValueOnce({ ...mockCustomer }),
          update: jest.fn(),
        },
        deal: {
          create: jest.fn().mockResolvedValue({ ...mockDeal, funds_reserved: true }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.createDeal(createDealDto);
      expect(result.status).toBe(DealStatus.PENDING);
      expect(result.vendor_id).toBe(createDealDto.targetId);
      expect(result.customer_id).toBe(createDealDto.initiatorId);
      expect(result.funds_reserved).toBe(true);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should create a deal successfully when vendor is initiator', async () => {
      const createDealDto = {
        amount: 100,
        initiatorId: mockVendor.id,
        targetId: mockCustomer.id,
        description: 'Test deal',
        isCustomerInitiator: false,
      };

      const mockPrisma = {
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce({ ...mockCustomer })
            .mockResolvedValueOnce({ ...mockVendor }),
        },
        deal: {
          create: jest.fn().mockResolvedValue(mockDeal),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.createDeal(createDealDto);
      expect(result.status).toBe(DealStatus.PENDING);
      expect(result.vendor_id).toBe(createDealDto.initiatorId);
      expect(result.customer_id).toBe(createDealDto.targetId);
      expect(result.funds_reserved).toBe(false);
    });

    it('should throw BadRequestException when vendor not found', async () => {
      const createDealDto = {
        amount: 100,
        initiatorId: mockCustomer.id,
        targetId: 'non-existent-id',
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      const mockPrisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.createDeal(createDealDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when customer has insufficient funds', async () => {
      const createDealDto = {
        amount: 2000,
        initiatorId: mockCustomer.id,
        targetId: mockVendor.id,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      const mockPrisma = {
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce({ ...mockVendor })
            .mockResolvedValueOnce({ ...mockCustomer, balance: 100 }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.createDeal(createDealDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptDeal', () => {
    it('should accept a deal successfully when vendor accepts customer-initiated deal', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            initiator: DealInitiator.CUSTOMER,
            funds_reserved: true
          }),
          update: jest.fn().mockResolvedValue({ ...mockActiveDeal }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockVendor),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.acceptDeal(mockDeal.id, mockVendor.id);
      expect(result.status).toBe(DealStatus.ACTIVE);
      expect(result.funds_reserved).toBe(true);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should accept a deal successfully when customer accepts vendor-initiated deal', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            initiator: DealInitiator.VENDOR,
          }),
          update: jest.fn().mockResolvedValue(mockActiveDeal),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockCustomer),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.acceptDeal(mockDeal.id, mockCustomer.id);
      expect(result.status).toBe(DealStatus.ACTIVE);
      expect(result.funds_reserved).toBe(true);
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.acceptDeal('non-existent-id', mockVendor.id)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when deal is not in PENDING status', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            status: DealStatus.ACTIVE,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.acceptDeal(mockDeal.id, mockVendor.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('declineDeal', () => {
    it('should decline a deal successfully', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDeal),
          update: jest.fn().mockResolvedValue({
            ...mockDeal,
            status: DealStatus.DECLINED,
            declined_at: expect.any(Date),
            declined_by: UserRole.VENDOR,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.declineDeal(mockDeal.id, mockVendor.id);
      expect(result.status).toBe(DealStatus.DECLINED);
      expect(result.declined_by).toBe(UserRole.VENDOR);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should release funds when vendor declines customer-initiated deal', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            initiator: DealInitiator.CUSTOMER,
            funds_reserved: true
          }),
          update: jest.fn().mockResolvedValue({
            ...mockDeal,
            status: DealStatus.DECLINED
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockCustomer),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await service.declineDeal(mockDeal.id, mockVendor.id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
        data: {
          balance: { increment: 100 },
          reserved_balance: { decrement: 100 }
        },
      });
    });
  });

  describe('cancelDeal', () => {
    it('should cancel a deal successfully', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDeal),
          update: jest.fn().mockResolvedValue({
            ...mockDeal,
            status: DealStatus.CANCELLED,
            cancelled_at: expect.any(Date),
            cancelled_by: UserRole.CUSTOMER,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.cancelDeal(mockDeal.id, mockCustomer.id);
      expect(result.status).toBe(DealStatus.CANCELLED);
      expect(result.cancelled_by).toBe(UserRole.CUSTOMER);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should release funds when cancelling a deal with reserved funds', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            funds_reserved: true,
          }),
          update: jest.fn().mockResolvedValue({
            ...mockDeal,
            status: DealStatus.CANCELLED,
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockCustomer),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await service.cancelDeal(mockDeal.id, mockCustomer.id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
        data: expect.objectContaining({
          balance: expect.any(Number),
          reserved_balance: expect.any(Number),
        }),
      });
    });
  });

  describe('confirmCompletion', () => {
    it('should confirm completion successfully', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockActiveDeal,
            status: DealStatus.ACTIVE
          }),
          update: jest.fn().mockResolvedValue({
            ...mockActiveDeal,
            status: DealStatus.COMPLETED,
            completed_at: expect.any(Date)
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockVendor),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.confirmCompletion(mockDeal.id, mockCustomer.id);
      expect(result.status).toBe(DealStatus.COMPLETED);
      expect(result.completed_at).toBeDefined();
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should transfer funds to vendor upon completion', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockActiveDeal,
            funds_reserved: true,
          }),
          update: jest.fn().mockResolvedValue({
            ...mockActiveDeal,
            status: DealStatus.COMPLETED,
          }),
        },
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockCustomer)
            .mockResolvedValueOnce(mockVendor),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await service.confirmCompletion(mockDeal.id, mockCustomer.id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockVendor.id },
        data: expect.objectContaining({
          balance: expect.any(Number),
        }),
      });
    });
  });

  describe('openDispute', () => {
    it('should open dispute successfully', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockActiveDeal),
          update: jest.fn().mockResolvedValue({
            ...mockActiveDeal,
            status: DealStatus.DISPUTED,
          }),
        },
        dispute: {
          create: jest.fn().mockResolvedValue({
            id: '123e4567-e89b-12d3-a456-426614174003',
            status: DisputeStatus.PENDING,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.openDispute(mockDeal.id, mockCustomer.id, 'Test dispute reason');
      expect(result.deal.status).toBe(DealStatus.DISPUTED);
      expect(result.dispute.status).toBe(DisputeStatus.PENDING);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deal is not in ACTIVE status', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            status: DealStatus.PENDING
          }),
        },
        dispute: {
          create: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.openDispute(mockDeal.id, mockCustomer.id, 'Test dispute reason'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute successfully with customer win', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDisputedDeal),
          update: jest.fn().mockResolvedValue({
            ...mockDisputedDeal,
            status: DealStatus.COMPLETED
          }),
        },
        dispute: {
          findUnique: jest.fn().mockResolvedValue(mockDisputedDeal.disputes[0]),
          update: jest.fn().mockResolvedValue({
            ...mockDisputedDeal.disputes[0],
            status: DisputeStatus.RESOLVED,
            resolution: 'CUSTOMER_WIN',
            resolved_at: expect.any(Date)
          }),
        },
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockCustomer)
            .mockResolvedValueOnce(mockVendor),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.resolveDispute(
        mockDeal.id,
        mockDisputedDeal.disputes[0].id,
        'CUSTOMER_WIN',
        mockModerator.id
      );
      expect(result.deal.status).toBe(DealStatus.COMPLETED);
      expect(result.dispute.status).toBe(DisputeStatus.RESOLVED);
      expect(result.dispute.resolution).toBe('CUSTOMER_WIN');
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when moderator not found', async () => {
      const mockPrisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.resolveDispute(
        mockDeal.id,
        mockDisputedDeal.disputes[0].id,
        'CUSTOMER_WIN',
        'non-existent-moderator'
      )).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveDeals', () => {
    it('should return active deals for a user', async () => {
      const mockPrisma = {
        deal: {
          findMany: jest.fn().mockResolvedValue([mockActiveDeal]),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.getActiveDeals(mockCustomer.id);
      expect(result).toEqual([mockActiveDeal]);
      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { customer_id: mockCustomer.id },
            { vendor_id: mockCustomer.id },
          ],
          status: DealStatus.ACTIVE,
        },
        include: {
          disputes: true,
        },
      });
    });
  });

  describe('getDealById', () => {
    it('should return deal by id', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDeal),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.getDealById(mockDeal.id);
      expect(result).toEqual(mockDeal);
      expect(mockPrisma.deal.findUnique).toHaveBeenCalledWith({
        where: { id: mockDeal.id },
        include: {
          disputes: true,
        },
      });
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.getDealById('non-existent-id')).rejects.toThrow(BadRequestException);
    });
  });
}); 