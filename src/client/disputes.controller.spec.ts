import { Test, TestingModule } from '@nestjs/testing';
import { DisputesController } from './client.controller';
import { DisputesClient } from './disputes.client';
import { DisputeStatus } from '@prisma/client';

describe('DisputesController', () => {
  let controller: DisputesController;
  let disputesClient: DisputesClient;

  const mockDisputesClient = {
    openDispute: jest.fn(),
    resolveDispute: jest.fn(),
    getDisputeById: jest.fn(),
    getDisputesByDealId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [
        {
          provide: DisputesClient,
          useValue: mockDisputesClient,
        },
      ],
    }).compile();

    controller = module.get<DisputesController>(DisputesController);
    disputesClient = module.get<DisputesClient>(DisputesClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('openDispute', () => {
    it('should open a dispute', async () => {
      const openDisputeRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        reason: 'Test dispute reason',
      };

      const expectedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        status: DisputeStatus.PENDING,
        message: 'Dispute opened successfully',
      };

      mockDisputesClient.openDispute.mockResolvedValue(expectedResponse);

      const result = await controller.openDispute(openDisputeRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDisputesClient.openDispute).toHaveBeenCalledWith(openDisputeRequest);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute', async () => {
      const resolveDisputeRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
        disputeId: '123e4567-e89b-12d3-a456-426614174003',
        resolution: 'CUSTOMER_WON' as const,
        moderatorId: '123e4567-e89b-12d3-a456-426614174004',
      };

      const expectedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        status: DisputeStatus.RESOLVED,
        message: 'Dispute resolved successfully',
      };

      mockDisputesClient.resolveDispute.mockResolvedValue(expectedResponse);

      const result = await controller.resolveDispute(resolveDisputeRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDisputesClient.resolveDispute).toHaveBeenCalledWith(resolveDisputeRequest);
    });
  });

  describe('getDisputeById', () => {
    it('should get a dispute by id', async () => {
      const getDisputeByIdRequest = {
        disputeId: '123e4567-e89b-12d3-a456-426614174003',
      };

      const expectedResponse = {
        dispute: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          deal_id: '123e4567-e89b-12d3-a456-426614174002',
          opened_by: '123e4567-e89b-12d3-a456-426614174001',
          opened_by_role: 'CUSTOMER',
          reason: 'Test dispute reason',
          status: DisputeStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      mockDisputesClient.getDisputeById.mockResolvedValue(expectedResponse);

      const result = await controller.getDisputeById(getDisputeByIdRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDisputesClient.getDisputeById).toHaveBeenCalledWith(getDisputeByIdRequest);
    });
  });

  describe('getDisputesByDealId', () => {
    it('should get disputes by deal id', async () => {
      const getDisputesByDealIdRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const expectedResponse = {
        disputes: [
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            deal_id: '123e4567-e89b-12d3-a456-426614174002',
            opened_by: '123e4567-e89b-12d3-a456-426614174001',
            opened_by_role: 'CUSTOMER',
            reason: 'Test dispute reason',
            status: DisputeStatus.PENDING,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      mockDisputesClient.getDisputesByDealId.mockResolvedValue(expectedResponse);

      const result = await controller.getDisputesByDealId(getDisputesByDealIdRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDisputesClient.getDisputesByDealId).toHaveBeenCalledWith(getDisputesByDealIdRequest);
    });
  });
}); 