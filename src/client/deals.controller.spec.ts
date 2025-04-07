import { Test, TestingModule } from '@nestjs/testing';
import { DealsController } from './client.controller';
import { DealsClient } from './deals.client';
import { DealStatus, DealInitiator } from '@prisma/client';

describe('DealsController', () => {
  let controller: DealsController;
  let dealsClient: DealsClient;

  const mockDealsClient = {
    createDeal: jest.fn(),
    acceptDeal: jest.fn(),
    declineDeal: jest.fn(),
    cancelDeal: jest.fn(),
    confirmCompletion: jest.fn(),
    getActiveDeals: jest.fn(),
    getDealById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealsController],
      providers: [
        {
          provide: DealsClient,
          useValue: mockDealsClient,
        },
      ],
    }).compile();

    controller = module.get<DealsController>(DealsController);
    dealsClient = module.get<DealsClient>(DealsClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDeal', () => {
    it('should create a deal', async () => {
      const createDealRequest = {
        initiatorId: '123e4567-e89b-12d3-a456-426614174000',
        targetId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000,
        description: 'Test deal',
        isCustomerInitiator: true,
      };

      const expectedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: DealStatus.PENDING,
        message: 'Deal created successfully',
      };

      mockDealsClient.createDeal.mockResolvedValue(expectedResponse);

      const result = await controller.createDeal(createDealRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDealsClient.createDeal).toHaveBeenCalledWith(createDealRequest);
    });
  });

  describe('acceptDeal', () => {
    it('should accept a deal', async () => {
      const acceptDealRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const expectedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: DealStatus.ACTIVE,
        message: 'Deal accepted successfully',
      };

      mockDealsClient.acceptDeal.mockResolvedValue(expectedResponse);

      const result = await controller.acceptDeal(acceptDealRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDealsClient.acceptDeal).toHaveBeenCalledWith(acceptDealRequest);
    });
  });

  describe('declineDeal', () => {
    it('should decline a deal', async () => {
      const declineDealRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const expectedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: DealStatus.DECLINED,
        message: 'Deal declined successfully',
      };

      mockDealsClient.declineDeal.mockResolvedValue(expectedResponse);

      const result = await controller.declineDeal(declineDealRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDealsClient.declineDeal).toHaveBeenCalledWith(declineDealRequest);
    });
  });

  describe('cancelDeal', () => {
    it('should cancel a deal', async () => {
      const cancelDealRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const expectedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: DealStatus.CANCELLED,
        message: 'Deal cancelled successfully',
      };

      mockDealsClient.cancelDeal.mockResolvedValue(expectedResponse);

      const result = await controller.cancelDeal(cancelDealRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDealsClient.cancelDeal).toHaveBeenCalledWith(cancelDealRequest);
    });
  });

  describe('confirmCompletion', () => {
    it('should confirm completion of a deal', async () => {
      const confirmCompletionRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const expectedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: DealStatus.COMPLETED,
        message: 'Deal completed successfully',
      };

      mockDealsClient.confirmCompletion.mockResolvedValue(expectedResponse);

      const result = await controller.confirmCompletion(confirmCompletionRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDealsClient.confirmCompletion).toHaveBeenCalledWith(confirmCompletionRequest);
    });
  });

  describe('getActiveDeals', () => {
    it('should get active deals for a user', async () => {
      const getActiveDealsRequest = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const expectedResponse = {
        deals: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            status: DealStatus.ACTIVE,
            customer_id: '123e4567-e89b-12d3-a456-426614174000',
            vendor_id: '123e4567-e89b-12d3-a456-426614174001',
            amount: 1000,
            description: 'Test deal',
            initiator: DealInitiator.CUSTOMER,
            funds_reserved: true,
            created_at: new Date(),
            accepted_at: new Date(),
          },
        ],
      };

      mockDealsClient.getActiveDeals.mockResolvedValue(expectedResponse);

      const result = await controller.getActiveDeals(getActiveDealsRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDealsClient.getActiveDeals).toHaveBeenCalledWith(getActiveDealsRequest);
    });
  });

  describe('getDealById', () => {
    it('should get a deal by id', async () => {
      const getDealByIdRequest = {
        dealId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const expectedResponse = {
        deal: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          status: DealStatus.ACTIVE,
          customer_id: '123e4567-e89b-12d3-a456-426614174000',
          vendor_id: '123e4567-e89b-12d3-a456-426614174001',
          amount: 1000,
          description: 'Test deal',
          initiator: DealInitiator.CUSTOMER,
          funds_reserved: true,
          created_at: new Date(),
          accepted_at: new Date(),
        },
      };

      mockDealsClient.getDealById.mockResolvedValue(expectedResponse);

      const result = await controller.getDealById(getDealByIdRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockDealsClient.getDealById).toHaveBeenCalledWith(getDealByIdRequest);
    });
  });
}); 