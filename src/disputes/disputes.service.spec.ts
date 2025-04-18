import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException } from '@nestjs/common';
import { DisputeStatus, UserRole, DealStatus, DealInitiator } from '@prisma/client';

describe('DisputesService', () => {
  let service: DisputesService;
  let prismaService: PrismaService;

  const mockDeal = {
    id: 'deal-id',
    customer_id: 'customer-id',
    vendor_id: 'vendor-id',
    status: DealStatus.ACTIVE,
    disputes: [],
  };

  const mockDispute = {
    id: 'dispute-id',
    deal_id: 'deal-id',
    opened_by: 'customer-id',
    opened_by_role: UserRole.CUSTOMER,
    reason: 'Test reason',
    status: DisputeStatus.PENDING,
    created_at: new Date(),
    updated_at: new Date(),
    resolved_at: null,
    resolution: null,
  };

  const mockModerator = {
    id: 'moderator-id',
    role: UserRole.MODERATOR,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((callback) => {
              const prisma = {
                deal: {
                  findUnique: jest.fn(),
                  update: jest.fn(),
                },
                dispute: {
                  create: jest.fn(),
                  update: jest.fn(),
                  delete: jest.fn(),
                  findUnique: jest.fn(),
                  findMany: jest.fn(),
                },
                user: {
                  findUnique: jest.fn(),
                  update: jest.fn(),
                },
              };
              return callback(prisma);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteDispute', () => {
    it('should delete a dispute', async () => {
      const mockPrisma = {
        dispute: {
          delete: jest.fn().mockResolvedValue({ id: 'test-id', deal_id: 'deal-id' }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.deleteDispute('test-id');
      expect(result).toEqual({ id: 'test-id', deal_id: 'deal-id' });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('openDispute', () => {
    it('should open a dispute successfully', async () => {
      const dealId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174002';
      const reason = 'Test dispute reason';

      const mockDeal = {
        id: dealId,
        customer_id: '123e4567-e89b-12d3-a456-426614174002',
        vendor_id: '123e4567-e89b-12d3-a456-426614174003',
        status: DealStatus.ACTIVE,
        created_at: new Date(),
        amount: 100,
        description: 'Test deal',
        initiator: DealInitiator.CUSTOMER,
        funds_reserved: true,
        disputes: [],
        accepted_at: null,
        declined_at: null,
        cancelled_at: null,
        completed_at: null,
        accepted_by: null,
        declined_by: null,
        cancelled_by: null,
        completed_by: null,
      };

      const mockDispute = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        deal_id: dealId,
        status: DisputeStatus.PENDING,
        opened_by: userId,
        opened_by_role: 'CUSTOMER',
        reason,
        resolution: null,
        resolved_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDeal),
          update: jest.fn().mockResolvedValue({
            ...mockDeal,
            status: DealStatus.DISPUTED,
          }),
        },
        dispute: {
          create: jest.fn().mockResolvedValue(mockDispute),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.openDispute(dealId, userId, reason);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockDispute.id);
      expect(result.status).toBe(DisputeStatus.PENDING);
      expect(result.message).toBe('Dispute opened successfully');
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.openDispute('non-existent-deal', 'user-id', 'Test dispute'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user is not a participant', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            customer_id: 'customer-id',
            vendor_id: 'vendor-id',
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.openDispute('deal-id', 'non-participant-id', 'Test dispute'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when dispute is already open', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockDeal,
            disputes: [{ status: DisputeStatus.PENDING }],
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.openDispute('deal-id', 'user-id', 'Test dispute'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute successfully', async () => {
      const mockPrisma = {
        dispute: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'dispute-id',
            deal_id: 'deal-id',
            status: DisputeStatus.PENDING,
          }),
          update: jest.fn().mockResolvedValue({
            id: 'dispute-id',
            deal_id: 'deal-id',
            status: DisputeStatus.RESOLVED,
            resolved_at: expect.any(Date),
            resolution: 'Test resolution',
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'moderator-id',
            role: UserRole.MODERATOR,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.resolveDispute('deal-id', 'dispute-id', 'Test resolution', 'moderator-id');
      expect(result.status).toBe(DisputeStatus.RESOLVED);
      expect(result.id).toBe('dispute-id');
      expect(result.message).toBe('Dispute resolved successfully');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when dispute not found', async () => {
      const mockPrisma = {
        dispute: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'moderator-id',
            role: UserRole.MODERATOR,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.resolveDispute('deal-id', 'non-existent-dispute', 'Test resolution', 'moderator-id'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user is not a moderator', async () => {
      const mockPrisma = {
        dispute: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'dispute-id',
            status: DisputeStatus.PENDING,
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'user-id',
            role: UserRole.CUSTOMER,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.resolveDispute('deal-id', 'dispute-id', 'Test resolution', 'user-id'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when dispute is already resolved', async () => {
      const mockPrisma = {
        dispute: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'dispute-id',
            status: DisputeStatus.RESOLVED,
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'moderator-id',
            role: UserRole.MODERATOR,
          }),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.resolveDispute('deal-id', 'dispute-id', 'Test resolution', 'moderator-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getDisputeById', () => {
    it('should get a dispute by id', async () => {
      const mockPrisma = {
        dispute: {
          findUnique: jest.fn().mockResolvedValue(mockDispute),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.getDisputeById('dispute-id');
      expect(result.dispute).toEqual(mockDispute);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when dispute not found', async () => {
      const mockPrisma = {
        dispute: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.getDisputeById('non-existent-dispute'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getDisputesByDealId', () => {
    it('should get all disputes for a deal', async () => {
      const mockPrisma = {
        dispute: {
          findMany: jest.fn().mockResolvedValue([mockDispute]),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.getDisputesByDealId('deal-id');
      expect(result.disputes).toEqual([mockDispute]);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });
});
