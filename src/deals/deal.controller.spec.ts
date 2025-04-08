import { Test, TestingModule } from '@nestjs/testing';
import { DealController } from './deal.controller';
import { DealService } from './deal.service';
import { RpcException } from '@nestjs/microservices';
import { DealStatus, DealInitiator, DisputeStatus } from '@prisma/client';
import { validate } from 'class-validator';
import { CreateDealDto } from './dto/create-deal.dto';
import { AcceptDealDto } from './dto/accept-deal.dto';
import { DeclineDealDto } from './dto/decline-deal.dto';
import { CancelDealDto } from './dto/cancel-deal.dto';
import { ConfirmCompletionDto } from './dto/confirm-completion.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { CancelDealRequest, ConfirmCompletionRequest } from 'src/client/deals.client';
import { UserRole } from '@prisma/client';

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
    customer_id: '123e4567-e89b-12d3-a456-426614174001',
    vendor_id: '123e4567-e89b-12d3-a456-426614174002',
    amount: 100,
    description: 'Test deal',
    status: DealStatus.PENDING,
    initiator: DealInitiator.CUSTOMER,
    funds_reserved: false,
    created_at: new Date(),
    updated_at: new Date(),
    accepted_at: null,
    completed_at: null,
    cancelled_at: null,
    cancelled_by: null,
    declined_at: null,
    declined_by: null,
    disputes: []
  };

  const mockUser = {
    userId: '123e4567-e89b-12d3-a456-426614174001',
    role: UserRole.CUSTOMER
  };

  const mockActiveDeal = {
    id: '123e4567-e89b-12d3-a456-426614174006',
    status: DealStatus.ACTIVE,
    customer_id: '123e4567-e89b-12d3-a456-426614174001',
    vendor_id: '123e4567-e89b-12d3-a456-426614174002',
    amount: 100,
    description: 'Test active deal',
    initiator: DealInitiator.CUSTOMER,
    funds_reserved: true,
    disputes: [],
  };

  const mockDisputedDeal = {
    id: '123e4567-e89b-12d3-a456-426614174007',
    status: DealStatus.DISPUTED,
    customer_id: '123e4567-e89b-12d3-a456-426614174001',
    vendor_id: '123e4567-e89b-12d3-a456-426614174002',
    amount: 100,
    description: 'Test disputed deal',
    initiator: DealInitiator.CUSTOMER,
    funds_reserved: true,
    disputes: [
      {
        id: '123e4567-e89b-12d3-a456-426614174008',
        status: DisputeStatus.PENDING,
        deal_id: '123e4567-e89b-12d3-a456-426614174007',
        opened_by: '123e4567-e89b-12d3-a456-426614174001',
        opened_by_role: 'CUSTOMER',
        reason: 'Test dispute reason',
      }
    ],
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
            acceptDeal: jest.fn().mockResolvedValue({ ...mockDeal, status: DealStatus.ACTIVE }),
            declineDeal: jest.fn().mockResolvedValue({ ...mockDeal, status: DealStatus.DECLINED }),
            cancelDeal: jest.fn().mockResolvedValue({ ...mockDeal, status: DealStatus.CANCELLED }),
            confirmCompletion: jest.fn().mockResolvedValue({ ...mockActiveDeal, status: DealStatus.COMPLETED }),
            openDispute: jest.fn().mockResolvedValue({
              deal: { ...mockDeal, status: DealStatus.DISPUTED },
              dispute: {
                id: '123e4567-e89b-12d3-a456-426614174003',
                status: DisputeStatus.PENDING,
              },
            }),
            resolveDispute: jest.fn().mockResolvedValue({
              deal: { ...mockDisputedDeal, status: DealStatus.COMPLETED },
              dispute: {
                id: '123e4567-e89b-12d3-a456-426614174008',
                status: DisputeStatus.RESOLVED,
                resolution: 'CUSTOMER_WIN',
              },
            }),
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
      const createDealDto: CreateDealDto = {
        initiatorId: '123e4567-e89b-12d3-a456-426614174001',
        targetId: '123e4567-e89b-12d3-a456-426614174002',
        amount: 100,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      const result = await controller.createDeal(createDealDto);
      expect(result).toEqual({
        id: mockDeal.id,
        status: mockDeal.status,
        message: 'Deal created successfully',
      });
      expect(service.createDeal).toHaveBeenCalledWith(createDealDto);
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([{ property: 'initiatorId', constraints: { isUuid: 'initiatorId must be a UUID' } }]);

      const createDealDto: CreateDealDto = {
        initiatorId: 'invalid-uuid',
        targetId: '123e4567-e89b-12d3-a456-426614174002',
        amount: 100,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      await expect(controller.createDeal(createDealDto)).rejects.toThrow(RpcException);
    });
  });

  describe('acceptDeal', () => {
    it('should accept a deal successfully', async () => {
      const acceptDealDto: AcceptDealDto = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = await controller.acceptDeal(acceptDealDto);
      expect(result).toEqual({
        id: mockDeal.id,
        status: DealStatus.ACTIVE,
        message: 'Deal accepted successfully',
      });
      expect(service.acceptDeal).toHaveBeenCalledWith(acceptDealDto.dealId, acceptDealDto.userId);
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      const acceptDealDto: AcceptDealDto = {
        dealId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174002',
      };

      await expect(controller.acceptDeal(acceptDealDto)).rejects.toThrow(RpcException);
    });
  });

  describe('declineDeal', () => {
    it('should decline a deal successfully', async () => {
      const declineDealDto: DeclineDealDto = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = await controller.declineDeal(declineDealDto);
      expect(result).toEqual({
        id: mockDeal.id,
        status: DealStatus.DECLINED,
        message: 'Deal declined successfully',
      });
      expect(service.declineDeal).toHaveBeenCalledWith(declineDealDto.dealId, declineDealDto.userId);
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      const declineDealDto: DeclineDealDto = {
        dealId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174002',
      };

      await expect(controller.declineDeal(declineDealDto)).rejects.toThrow(RpcException);
    });
  });

  describe('cancelDeal', () => {
    it('should cancel a deal successfully', async () => {
      const cancelDealDto: CancelDealRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = await controller.cancelDeal(cancelDealDto);
      expect(result).toEqual({
        id: mockDeal.id,
        status: DealStatus.CANCELLED,
        message: 'Deal cancelled successfully',
      });
      expect(service.cancelDeal).toHaveBeenCalledWith(cancelDealDto.dealId, cancelDealDto.userId);
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      const cancelDealDto: CancelDealRequest = {
        dealId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      await expect(controller.cancelDeal(cancelDealDto)).rejects.toThrow(RpcException);
    });
  });

  describe('confirmCompletion', () => {
    it('should confirm completion successfully', async () => {
      const confirmCompletionDto: ConfirmCompletionRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174006',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = await controller.confirmCompletion(confirmCompletionDto);
      expect(result).toEqual({
        id: mockActiveDeal.id,
        status: DealStatus.COMPLETED,
        message: 'Deal completed successfully',
      });
      expect(service.confirmCompletion).toHaveBeenCalledWith(confirmCompletionDto.dealId, confirmCompletionDto.userId);
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      const confirmCompletionDto: ConfirmCompletionRequest = {
        dealId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      await expect(controller.confirmCompletion(confirmCompletionDto)).rejects.toThrow(RpcException);
    });
  });

  describe('openDispute', () => {
    it('should open a dispute successfully', async () => {
      const openDisputeDto: OpenDisputeDto = {
        dealId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        reason: 'Test dispute reason',
      };

      const result = await controller.openDispute(openDisputeDto);
      expect(result).toEqual({
        id: mockDeal.id,
        status: DealStatus.DISPUTED,
        message: 'Dispute opened successfully',
      });
      expect(service.openDispute).toHaveBeenCalledWith(
        openDisputeDto.dealId,
        openDisputeDto.userId,
        openDisputeDto.reason,
      );
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      const openDisputeDto: OpenDisputeDto = {
        dealId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        reason: 'Test dispute reason',
      };

      await expect(controller.openDispute(openDisputeDto)).rejects.toThrow(RpcException);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute successfully', async () => {
      const resolveDisputeDto: ResolveDisputeDto = {
        dealId: '123e4567-e89b-12d3-a456-426614174007',
        disputeId: '123e4567-e89b-12d3-a456-426614174008',
        resolution: 'CUSTOMER_WIN',
        moderatorId: '123e4567-e89b-12d3-a456-426614174009',
      };
      const result = await controller.resolveDispute(resolveDisputeDto);
      expect(result).toEqual({
        id: mockDisputedDeal.id,
        status: DealStatus.COMPLETED,
        message: 'Dispute resolved successfully',
      });
      expect(service.resolveDispute).toHaveBeenCalledWith(
        resolveDisputeDto.dealId,
        resolveDisputeDto.disputeId,
        resolveDisputeDto.resolution,
        resolveDisputeDto.moderatorId,
      );
    });

    it('should throw RpcException when validation fails', async () => {
      (validate as jest.Mock).mockResolvedValueOnce([{ property: 'dealId', constraints: { isUuid: 'dealId must be a UUID' } }]);

      const resolveDisputeDto: ResolveDisputeDto = {
        dealId: 'invalid-uuid',
        disputeId: '123e4567-e89b-12d3-a456-426614174008',
        resolution: 'CUSTOMER_WIN',
        moderatorId: '123e4567-e89b-12d3-a456-426614174009',
      };

      await expect(controller.resolveDispute(resolveDisputeDto)).rejects.toThrow(RpcException);
    });
  });

  describe('getActiveDeals', () => {
    it('should return active deals for the authenticated user', async () => {
      const mockDeals = [mockDeal];
      jest.spyOn(service, 'getActiveDeals').mockResolvedValue(mockDeals);

      const result = await controller.getActiveDeals(mockUser);
      expect(result).toEqual({ deals: mockDeals });
      expect(service.getActiveDeals).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('getDealById', () => {
    it('should return a deal by id', async () => {
      jest.spyOn(service, 'getDealById').mockResolvedValue(mockDeal);

      const result = await controller.getDealById({ dealId: mockDeal.id });
      expect(result).toEqual({ deal: mockDeal });
      expect(service.getDealById).toHaveBeenCalledWith(mockDeal.id);
    });
  });
}); 