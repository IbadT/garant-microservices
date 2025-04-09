import { Test, TestingModule } from '@nestjs/testing';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { DisputeStatus } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

// Mock class-validator
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
    message: 'Dispute opened successfully',
  };

  const mockResolvedDispute = {
    ...mockDispute,
    status: DisputeStatus.RESOLVED,
    resolved_at: new Date('2025-04-08T04:34:39.451Z'),
    resolution: 'CUSTOMER_WIN',
    message: 'Dispute resolved successfully',
  };

  const mockDisputeResponse = {
    dispute: {
      id: mockDispute.id,
      deal_id: mockDispute.deal_id,
      opened_by: mockDispute.opened_by,
      opened_by_role: mockDispute.opened_by_role,
      reason: mockDispute.reason,
      status: mockDispute.status,
      resolved_at: null,
      resolution: null,
      created_at: mockDispute.created_at.toISOString(),
      updated_at: mockDispute.updated_at.toISOString(),
    },
  };

  const mockResolvedDisputeResponse = {
    dispute: {
      id: mockResolvedDispute.id,
      deal_id: mockResolvedDispute.deal_id,
      opened_by: mockResolvedDispute.opened_by,
      opened_by_role: mockResolvedDispute.opened_by_role,
      reason: mockResolvedDispute.reason,
      status: mockResolvedDispute.status,
      resolved_at: mockResolvedDispute.resolved_at.toISOString(),
      resolution: mockResolvedDispute.resolution,
      created_at: mockResolvedDispute.created_at.toISOString(),
      updated_at: mockResolvedDispute.updated_at.toISOString(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [
        {
          provide: DisputesService,
          useValue: {
            openDispute: jest.fn().mockResolvedValue(mockDispute),
            resolveDispute: jest.fn().mockResolvedValue(mockResolvedDispute),
            getDisputeById: jest.fn().mockResolvedValue(mockDisputeResponse),
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
        message: mockDispute.message,
      });
      expect(service.openDispute).toHaveBeenCalledWith(
        data.dealId,
        data.userId,
        data.reason,
      );
    });

    it('should throw RpcException when validation fails', async () => {
      // Mock the validate function to return errors
      const validateMock = jest.requireMock('class-validator').validate;
      validateMock.mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      // Mock the service to throw an exception
      jest.spyOn(service, 'openDispute').mockImplementationOnce(() => {
        throw new RpcException('Validation failed');
      });

      const data = {
        dealId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        reason: 'Test dispute reason',
      };

      await expect(controller.openDispute(data)).rejects.toThrow(RpcException);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute successfully', async () => {
      const data = {
        dealId: '123e4567-e89b-12d3-a456-426614174001',
        disputeId: '123e4567-e89b-12d3-a456-426614174000',
        moderatorId: '123e4567-e89b-12d3-a456-426614174003',
        resolution: 'CUSTOMER_WIN',
      };

      const result = await controller.resolveDispute(data);
      expect(result).toEqual({
        id: mockResolvedDispute.id,
        status: mockResolvedDispute.status,
        message: mockResolvedDispute.message,
      });
      expect(service.resolveDispute).toHaveBeenCalledWith(
        data.dealId,
        data.disputeId,
        data.resolution,
        data.moderatorId,
      );
    });

    it('should throw RpcException when validation fails', async () => {
      // Mock the validate function to return errors
      const validateMock = jest.requireMock('class-validator').validate;
      validateMock.mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      // Mock the service to throw an exception
      jest.spyOn(service, 'resolveDispute').mockImplementationOnce(() => {
        throw new RpcException('Validation failed');
      });

      const data = {
        dealId: 'invalid-uuid',
        disputeId: '123e4567-e89b-12d3-a456-426614174000',
        moderatorId: '123e4567-e89b-12d3-a456-426614174003',
        resolution: 'CUSTOMER_WIN',
      };

      await expect(controller.resolveDispute(data)).rejects.toThrow(RpcException);
    });
  });

  describe('getDisputeById', () => {
    it('should get a dispute by id successfully', async () => {
      const data = {
        disputeId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Mock the service to return a response with string dates
      jest.spyOn(service, 'getDisputeById').mockResolvedValueOnce({
        dispute: {
          ...mockDispute,
          created_at: mockDispute.created_at,
          updated_at: mockDispute.updated_at,
          resolved_at: null,
          resolution: null,
        },
      });

      const result = await controller.getDisputeById(data);
      expect(result).toEqual({
        dispute: {
          id: mockDispute.id,
          deal_id: mockDispute.deal_id,
          opened_by: mockDispute.opened_by,
          opened_by_role: mockDispute.opened_by_role,
          reason: mockDispute.reason,
          status: mockDispute.status,
          resolved_at: undefined,
          resolution: null,
          created_at: mockDispute.created_at.toISOString(),
          updated_at: mockDispute.updated_at.toISOString(),
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

      // Mock the service to return a response with string dates
      jest.spyOn(service, 'getDisputesByDealId').mockResolvedValueOnce({
        disputes: [{
          ...mockDispute,
          created_at: mockDispute.created_at,
          updated_at: mockDispute.updated_at,
          resolved_at: null,
          resolution: null,
        }],
      });

      const result = await controller.getDisputesByDealId(data);
      expect(result).toEqual({
        disputes: [{
          id: mockDispute.id,
          deal_id: mockDispute.deal_id,
          opened_by: mockDispute.opened_by,
          opened_by_role: mockDispute.opened_by_role,
          reason: mockDispute.reason,
          status: mockDispute.status,
          resolved_at: undefined,
          resolution: null,
          created_at: mockDispute.created_at.toISOString(),
          updated_at: mockDispute.updated_at.toISOString(),
        }],
      });
      expect(service.getDisputesByDealId).toHaveBeenCalledWith(data.dealId);
    });
  });
});
