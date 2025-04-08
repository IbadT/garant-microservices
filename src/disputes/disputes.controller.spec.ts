import { Test, TestingModule } from '@nestjs/testing';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { DisputeStatus } from '@prisma/client';
import { validate } from 'class-validator';

// Мокаем class-validator
jest.mock('class-validator', () => ({
  validate: jest.fn().mockResolvedValue([]),
  IsString: jest.fn(),
  IsUUID: jest.fn(),
  IsNotEmpty: jest.fn(),
}));

describe('DisputesController', () => {
  let controller: DisputesController;
  let service: DisputesService;

  const mockDispute = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    deal_id: '123e4567-e89b-12d3-a456-426614174001',
    status: DisputeStatus.PENDING,
    opened_by: '123e4567-e89b-12d3-a456-426614174002',
    opened_by_role: 'CUSTOMER',
    reason: 'Test dispute reason',
    created_at: new Date('2025-04-08T04:34:39.451Z'),
    updated_at: new Date('2025-04-08T04:34:39.451Z'),
    resolved_at: null,
    resolution: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [
        {
          provide: DisputesService,
          useValue: {
            openDispute: jest.fn().mockResolvedValue({ ...mockDispute, message: 'Dispute opened successfully' }),
            resolveDispute: jest.fn().mockResolvedValue({ ...mockDispute, status: DisputeStatus.RESOLVED, message: 'Dispute resolved successfully' }),
            getDisputeById: jest.fn().mockResolvedValue({ dispute: mockDispute }),
            getDisputesByDealId: jest.fn().mockResolvedValue({ disputes: [mockDispute] }),
          },
        },
      ],
    }).compile();

    controller = module.get<DisputesController>(DisputesController);
    service = module.get<DisputesService>(DisputesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('openDispute', () => {
    it('should open a dispute successfully', async () => {
      const data = {
        dealId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        reason: 'Test dispute reason',
      };

      const result = await controller.openDispute(data);
      expect(result).toEqual({
        id: mockDispute.id,
        status: mockDispute.status,
        message: 'Dispute opened successfully',
      });
      expect(service.openDispute).toHaveBeenCalledWith(
        data.dealId,
        data.userId,
        data.reason,
      );
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute successfully', async () => {
      const data = {
        dealId: '123e4567-e89b-12d3-a456-426614174001',
        disputeId: '123e4567-e89b-12d3-a456-426614174000',
        resolution: 'Test resolution',
        moderatorId: '123e4567-e89b-12d3-a456-426614174003',
      };

      const result = await controller.resolveDispute(data);
      expect(result).toEqual({
        id: mockDispute.id,
        status: DisputeStatus.RESOLVED,
        message: 'Dispute resolved successfully',
      });
      expect(service.resolveDispute).toHaveBeenCalledWith(
        data.dealId,
        data.disputeId,
        data.resolution,
        data.moderatorId,
      );
    });
  });

  describe('getDisputeById', () => {
    it('should get a dispute by id successfully', async () => {
      const data = {
        disputeId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = await controller.getDisputeById(data);
      expect(result).toEqual({
        dispute: {
          ...mockDispute,
          created_at: mockDispute.created_at.toISOString(),
          updated_at: mockDispute.updated_at.toISOString(),
          resolved_at: mockDispute.resolved_at,
        },
      });
      expect(service.getDisputeById).toHaveBeenCalledWith(data.disputeId);
    });
  });

  describe('getDisputesByDealId', () => {
    it('should get disputes by deal id successfully', async () => {
      const data = {
        dealId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = await controller.getDisputesByDealId(data);
      expect(result).toEqual({
        disputes: [{
          ...mockDispute,
          created_at: mockDispute.created_at.toISOString(),
          updated_at: mockDispute.updated_at.toISOString(),
          resolved_at: mockDispute.resolved_at,
        }],
      });
      expect(service.getDisputesByDealId).toHaveBeenCalledWith(data.dealId);
    });
  });
});
