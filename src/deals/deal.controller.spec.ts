import { Test, TestingModule } from '@nestjs/testing';
import { DealController } from './deal.controller';
import { DealService } from './deal.service';
import { RpcException } from '@nestjs/microservices';
import { DealStatus } from '@prisma/client';
import { validate } from 'class-validator';

// Мокаем class-validator
jest.mock('class-validator', () => ({
  validate: jest.fn().mockResolvedValue([]),
  IsString: jest.fn(),
  IsUUID: jest.fn(),
  IsNumber: jest.fn(),
  IsBoolean: jest.fn(),
  IsNotEmpty: jest.fn(),
  IsIn: jest.fn(),
  MinLength: jest.fn(),
  MaxLength: jest.fn(),
}));

// Мокаем все DTO
jest.mock('./dto/send-hello.dto', () => ({
  SendHelloDto: jest.fn(),
}));

jest.mock('./dto/create-deal.dto', () => ({
  CreateDealDto: jest.fn(),
}));

jest.mock('./dto/accept-deal.dto', () => ({
  AcceptDealDto: jest.fn(),
}));

jest.mock('./dto/cancel-deal.dto', () => ({
  CancelDealDto: jest.fn(),
}));

jest.mock('./dto/confirm-completion.dto', () => ({
  ConfirmCompletionDto: jest.fn(),
}));

jest.mock('./dto/decline-deal.dto', () => ({
  DeclineDealDto: jest.fn(),
}));

jest.mock('./dto/open-dispute.dto', () => ({
  OpenDisputeDto: jest.fn(),
}));

jest.mock('./dto/resolve-dispute.dto', () => ({
  ResolveDisputeDto: jest.fn(),
}));

describe('DealController', () => {
  let controller: DealController;
  let service: DealService;

  const mockDeal = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    status: DealStatus.PENDING,
    customer_id: '123e4567-e89b-12d3-a456-426614174001',
    vendor_id: '123e4567-e89b-12d3-a456-426614174002',
    amount: 100,
    description: 'Test deal',
    initiator: 'CUSTOMER',
    funds_reserved: true,
  };

  beforeEach(async () => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealController],
      providers: [
        {
          provide: DealService,
          useValue: {
            createDeal: jest.fn().mockResolvedValue(mockDeal),
            acceptDeal: jest.fn().mockResolvedValue(mockDeal),
            declineDeal: jest.fn().mockResolvedValue(mockDeal),
            cancelDeal: jest.fn().mockResolvedValue(mockDeal),
            confirmCompletion: jest.fn().mockResolvedValue(mockDeal),
            openDispute: jest.fn().mockResolvedValue({ deal: mockDeal, dispute: { id: '123e4567-e89b-12d3-a456-426614174003' } }),
            resolveDispute: jest.fn().mockResolvedValue({ deal: mockDeal, dispute: { id: '123e4567-e89b-12d3-a456-426614174003' } }),
            getActiveDeals: jest.fn().mockResolvedValue([mockDeal]),
            getDealById: jest.fn().mockResolvedValue(mockDeal),
          },
        },
      ],
    }).compile();

    controller = module.get<DealController>(DealController);
    service = module.get<DealService>(DealService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDeal', () => {
    it('should create a deal successfully', async () => {
      const createDealRequest = {
        initiatorId: '123e4567-e89b-12d3-a456-426614174001',
        targetId: '123e4567-e89b-12d3-a456-426614174002',
        amount: 100,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      const result = await controller.createDeal(createDealRequest);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Deal created successfully',
      });
      expect(service.createDeal).toHaveBeenCalledWith(createDealRequest);
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([
        {
          constraints: {
            isUUID: 'Initiator ID must be a valid UUID',
          },
        },
      ]);

      const invalidRequest = {
        initiatorId: '',
        targetId: '',
        amount: -100,
        description: '',
        isCustomerInitiator: true,
      };

      await expect(controller.createDeal(invalidRequest)).rejects.toThrow(RpcException);
    });
  });

  describe('acceptDeal', () => {
    it('should accept a deal successfully', async () => {
      const acceptDealRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = await controller.acceptDeal(acceptDealRequest);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Deal accepted successfully',
      });
      expect(service.acceptDeal).toHaveBeenCalledWith(acceptDealRequest.dealId, acceptDealRequest.userId);
    });
  });

  describe('declineDeal', () => {
    it('should decline a deal successfully', async () => {
      const declineDealRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = await controller.declineDeal(declineDealRequest);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Deal declined successfully',
      });
      expect(service.declineDeal).toHaveBeenCalledWith(declineDealRequest.dealId, declineDealRequest.userId);
    });
  });

  describe('cancelDeal', () => {
    it('should cancel a deal successfully', async () => {
      const cancelDealRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = await controller.cancelDeal(cancelDealRequest);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Deal cancelled successfully',
      });
      expect(service.cancelDeal).toHaveBeenCalledWith(cancelDealRequest.dealId, cancelDealRequest.userId);
    });
  });

  describe('confirmCompletion', () => {
    it('should confirm completion successfully', async () => {
      const confirmCompletionRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = await controller.confirmCompletion(confirmCompletionRequest);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Deal completed successfully',
      });
      expect(service.confirmCompletion).toHaveBeenCalledWith(confirmCompletionRequest.dealId, confirmCompletionRequest.userId);
    });
  });

  describe('openDispute', () => {
    it('should open a dispute successfully', async () => {
      const openDisputeRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        reason: 'Test reason',
      };

      const result = await controller.openDispute(openDisputeRequest);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Dispute opened successfully',
      });
      expect(service.openDispute).toHaveBeenCalledWith(
        openDisputeRequest.dealId,
        openDisputeRequest.userId,
        openDisputeRequest.reason,
      );
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute successfully', async () => {
      const resolveDisputeRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        disputeId: '123e4567-e89b-12d3-a456-426614174003',
        resolution: 'CUSTOMER_WON',
        moderatorId: '123e4567-e89b-12d3-a456-426614174004',
      };

      const result = await controller.resolveDispute(resolveDisputeRequest);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Dispute resolved successfully',
      });
      expect(service.resolveDispute).toHaveBeenCalledWith(
        resolveDisputeRequest.dealId,
        resolveDisputeRequest.disputeId,
        resolveDisputeRequest.resolution,
        resolveDisputeRequest.moderatorId,
      );
    });
  });

  describe('getActiveDeals', () => {
    it('should get active deals successfully', async () => {
      const getActiveDealsRequest = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = await controller.getActiveDeals(getActiveDealsRequest);
      expect(result).toEqual({ deals: [mockDeal] });
      expect(service.getActiveDeals).toHaveBeenCalledWith(getActiveDealsRequest.userId);
    });
  });

  describe('getDealById', () => {
    it('should get deal by id successfully', async () => {
      const getDealByIdRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = await controller.getDealById(getDealByIdRequest);
      expect(result).toEqual({ deal: mockDeal });
      expect(service.getDealById).toHaveBeenCalledWith(getDealByIdRequest.dealId);
    });
  });
}); 