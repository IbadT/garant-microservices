import { Test, TestingModule } from '@nestjs/testing';
import { DealService } from './deal.service';
import { PrismaService } from '../prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationService } from '../notifications/notification.service';
import { BadRequestException } from '@nestjs/common';
import { DealStatus, DealInitiator, DisputeStatus, UserRole } from '@prisma/client';
import { DisputeResolution } from './types/dispute-resolution.enum';
import { CommissionService } from '../commission/commission.service';
import { ConfigModule } from '@nestjs/config';

describe('DealService', () => {
  let service: DealService;
  let prismaService: PrismaService;
  let kafkaService: KafkaService;
  let notificationService: NotificationService;
  let commissionService: CommissionService;

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
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        DealService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            deal: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            dispute: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback({
              user: {
                findUnique: jest.fn(),
                update: jest.fn(),
              },
              deal: {
                create: jest.fn(),
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
            publishDealUpdate: jest.fn(),
            sendDealEvent: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendNotification: jest.fn(),
            notifyUser: jest.fn(),
          },
        },
        {
          provide: CommissionService,
          useValue: {
            calculateCommission: jest.fn().mockResolvedValue(10),
            addToCommissionBalance: jest.fn(),
            refundCommission: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DealService>(DealService);
    prismaService = module.get<PrismaService>(PrismaService);
    kafkaService = module.get<KafkaService>(KafkaService);
    notificationService = module.get<NotificationService>(NotificationService);
    commissionService = module.get<CommissionService>(CommissionService);

    // Add sendDealEvent method to service
    (service as any).sendDealEvent = jest.fn();
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
      const customerInitiatedDeal = {
        ...mockDeal,
        initiator: DealInitiator.CUSTOMER,
      };
      
      // Mock the validateDealAction method to return isVendor: false
      jest.spyOn(service as any, 'validateDealAction').mockReturnValue({ isCustomer: true, isVendor: false });
      
      // Mock the validateAndReserveFunds method
      jest.spyOn(service as any, 'validateAndReserveFunds').mockResolvedValue(undefined);
      
      // Mock the transaction callback
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          deal: {
            findUnique: jest.fn().mockResolvedValue(customerInitiatedDeal),
            update: jest.fn().mockResolvedValue({
              ...customerInitiatedDeal,
              status: DealStatus.ACTIVE,
              accepted_at: new Date(),
            }),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue(mockVendor),
          },
        };
        
        const result = await callback(mockTx);
        return {
          ...customerInitiatedDeal,
          status: DealStatus.ACTIVE,
          accepted_at: new Date(),
        };
      });

      const dealId = customerInitiatedDeal.id;
      const userId = mockVendor.id;

      const result = await service.acceptDeal(dealId, userId);

      expect(result.status).toBe(DealStatus.ACTIVE);
      expect(result.accepted_at).toBeDefined();
      expect(service['validateDealAction']).toHaveBeenCalledWith(expect.any(Object), userId, 'accept');
      expect(kafkaService.sendDealEvent).toHaveBeenCalledWith({
        type: 'DEAL_ACCEPTED',
        payload: expect.any(Object)
      });
    });

    it('should accept a deal successfully when customer accepts vendor-initiated deal', async () => {
      const vendorInitiatedDeal = {
        ...mockDeal,
        id: '123e4567-e89b-12d3-a456-426614174009',
        initiator: DealInitiator.VENDOR,
      };
      
      // Mock the validateDealAction method to return isCustomer: true
      jest.spyOn(service as any, 'validateDealAction').mockReturnValue({ isCustomer: true, isVendor: false });
      
      // Mock the validateAndReserveFunds method
      jest.spyOn(service as any, 'validateAndReserveFunds').mockResolvedValue(undefined);
      
      // Mock the transaction callback
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          deal: {
            findUnique: jest.fn().mockResolvedValue(vendorInitiatedDeal),
            update: jest.fn().mockResolvedValue({
              ...vendorInitiatedDeal,
              status: DealStatus.ACTIVE,
              accepted_at: new Date(),
              funds_reserved: true,
            }),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue(mockCustomer),
          },
        };
        
        const result = await callback(mockTx);
        return {
          ...vendorInitiatedDeal,
          status: DealStatus.ACTIVE,
          accepted_at: new Date(),
          funds_reserved: true,
        };
      });

      const dealId = vendorInitiatedDeal.id;
      const userId = mockCustomer.id;

      const result = await service.acceptDeal(dealId, userId);

      expect(result.status).toBe(DealStatus.ACTIVE);
      expect(result.accepted_at).toBeDefined();
      expect(result.funds_reserved).toBe(true);
      expect(service['validateDealAction']).toHaveBeenCalledWith(expect.any(Object), userId, 'accept');
      expect(service['validateAndReserveFunds']).toHaveBeenCalledWith(expect.any(String), expect.any(Number), expect.any(Object));
      expect(kafkaService.sendDealEvent).toHaveBeenCalledWith({
        type: 'DEAL_ACCEPTED',
        payload: expect.any(Object)
      });
    });

    it('should throw BadRequestException when deal is not found', async () => {
      const dealId = 'non-existent-deal-id';
      const userId = mockVendor.id;

      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.acceptDeal(dealId, userId)).rejects.toThrow(BadRequestException);
      await expect(service.acceptDeal(dealId, userId)).rejects.toThrow('Deal not found');
    });

    it('should throw BadRequestException when user is not authorized', async () => {
      const dealId = mockDeal.id;
      const userId = 'unauthorized-user-id';

      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDeal),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.acceptDeal(dealId, userId)).rejects.toThrow(BadRequestException);
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
            declined_at: new Date(),
            declined_by: mockVendor.id,
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockVendor),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.declineDeal(mockDeal.id, mockVendor.id);
      expect(result.status).toBe(DealStatus.DECLINED);
      expect(result.declined_at).toBeDefined();
      expect(result.declined_by).toBe(mockVendor.id);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.declineDeal('non-existent-id', mockVendor.id)).rejects.toThrow(BadRequestException);
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
            cancelled_at: new Date(),
            cancelled_by: mockCustomer.id,
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockCustomer),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.cancelDeal(mockDeal.id, mockCustomer.id);
      expect(result.status).toBe(DealStatus.CANCELLED);
      expect(result.cancelled_at).toBeDefined();
      expect(result.cancelled_by).toBe(mockCustomer.id);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.cancelDeal('non-existent-id', mockCustomer.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmCompletion', () => {
    it('should confirm completion successfully', async () => {
      const activeDeal = {
        ...mockDeal,
        id: '123e4567-e89b-12d3-a456-426614174010',
        status: DealStatus.ACTIVE,
        funds_reserved: true,
      };
      
      // Mock the validateDealAction method to return isCustomer: true
      jest.spyOn(service as any, 'validateDealAction').mockReturnValue({ isCustomer: true, isVendor: false });
      
      // Mock the transferFundsToVendor method
      jest.spyOn(service as any, 'transferFundsToVendor').mockResolvedValue(undefined);
      
      // Mock the transaction callback
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          deal: {
            findUnique: jest.fn().mockResolvedValue(activeDeal),
            update: jest.fn().mockResolvedValue({
              ...activeDeal,
              status: DealStatus.COMPLETED,
              completed_at: new Date(),
            }),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue(mockCustomer),
          },
        };
        
        const result = await callback(mockTx);
        return {
          ...activeDeal,
          status: DealStatus.COMPLETED,
          completed_at: new Date(),
        };
      });

      const dealId = activeDeal.id;
      const userId = mockCustomer.id;

      const result = await service.confirmCompletion(dealId, userId);

      expect(result.status).toBe(DealStatus.COMPLETED);
      expect(result.completed_at).toBeDefined();
      expect(service['validateDealAction']).toHaveBeenCalledWith(expect.any(Object), userId, 'confirm completion');
      expect(service['transferFundsToVendor']).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
      expect(kafkaService.sendDealEvent).toHaveBeenCalledWith({
        type: 'DEAL_COMPLETED',
        payload: expect.any(Object)
      });
    });

    it('should throw BadRequestException when deal is not found', async () => {
      const dealId = 'non-existent-deal-id';
      const userId = mockCustomer.id;

      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.confirmCompletion(dealId, userId)).rejects.toThrow(BadRequestException);
      await expect(service.confirmCompletion(dealId, userId)).rejects.toThrow('Deal not found');
    });

    it('should throw BadRequestException when deal is not in ACTIVE status', async () => {
      const dealId = mockDeal.id;
      const userId = mockCustomer.id;

      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDeal),
        },
      };
      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.confirmCompletion(dealId, userId)).rejects.toThrow(BadRequestException);
      await expect(service.confirmCompletion(dealId, userId)).rejects.toThrow('Can only confirm completion of an active deal');
    });
  });

  describe('openDispute', () => {
    it('should open a dispute successfully', async () => {
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
            deal_id: mockActiveDeal.id,
            status: DisputeStatus.PENDING,
            opened_by: mockCustomer.id,
            opened_by_role: UserRole.CUSTOMER,
            reason: 'Test dispute',
            created_at: new Date(),
            updated_at: new Date(),
          }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockCustomer),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      const result = await service.openDispute(mockActiveDeal.id, mockCustomer.id, 'Test dispute');
      expect(result.deal.status).toBe(DealStatus.DISPUTED);
      expect(result.dispute.status).toBe(DisputeStatus.PENDING);
      expect(result.dispute.opened_by).toBe(mockCustomer.id);
      expect(kafkaService.sendDealEvent).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deal not found', async () => {
      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.openDispute('non-existent-id', mockCustomer.id, 'Test dispute')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute successfully', async () => {
      const dealId = mockDisputedDeal.id;
      const disputeId = mockDisputedDeal.disputes[0].id;
      const resolution = DisputeResolution.CUSTOMER_WON;
      const moderatorId = mockModerator.id;
      
      const pendingDispute = {
        ...mockDisputedDeal.disputes[0],
        status: DisputeStatus.PENDING,
        resolution: null,
        resolved_at: null
      };

      const resolvedDispute = {
        ...pendingDispute,
        status: DisputeStatus.RESOLVED,
        resolution: resolution,
        resolved_at: new Date()
      };

      const completedDeal = {
        ...mockDisputedDeal,
        status: DealStatus.COMPLETED,
        completed_at: new Date(),
        disputes: [resolvedDispute]
      };
      
      // Mock the transferFundsToVendor method
      jest.spyOn(service as any, 'transferFundsToVendor').mockResolvedValue(undefined);
      
      // Mock the releaseFunds method
      jest.spyOn(service as any, 'releaseFunds').mockResolvedValue(undefined);
      
      // Reset the mock calls before the test
      (kafkaService.sendDealEvent as jest.Mock).mockClear();
      (notificationService.notifyUser as jest.Mock).mockClear();
      
      // Mock the transaction callback
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          deal: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockDisputedDeal,
              disputes: [pendingDispute]
            }),
            update: jest.fn().mockResolvedValue(completedDeal),
          },
          dispute: {
            findUnique: jest.fn().mockResolvedValue(pendingDispute),
            update: jest.fn().mockResolvedValue(resolvedDispute),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue(mockModerator),
            update: jest.fn().mockResolvedValue({
              ...mockModerator,
              balance: 1000
            }),
          },
        };
        
        const result = await callback(mockTx);
        return {
          deal: completedDeal,
          dispute: resolvedDispute
        };
      });
      
      const result = await service.resolveDispute(dealId, disputeId, resolution, moderatorId);

      expect(result.deal.status).toBe(DealStatus.COMPLETED);
      expect(result.dispute.status).toBe(DisputeStatus.RESOLVED);
      expect(result.dispute.resolution).toBe(resolution);
      expect(result.dispute.resolved_at).toBeDefined();
      
      // Verify Kafka event was sent with the correct payload
      expect(kafkaService.sendDealEvent).toHaveBeenCalledWith({
        type: 'DISPUTE_RESOLVED',
        payload: {
          deal: completedDeal,
          dispute: pendingDispute
        }
      });

      // Verify notifications were sent to both customer and vendor
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        mockCustomer.id,
        {
          type: 'DISPUTE_RESOLVED',
          dealId: dealId,
          disputeId: disputeId,
          resolution: resolution,
        }
      );

      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        mockVendor.id,
        {
          type: 'DISPUTE_RESOLVED',
          dealId: dealId,
          disputeId: disputeId,
          resolution: resolution,
        }
      );
    });

    it('should throw BadRequestException when deal is not found', async () => {
      const dealId = 'non-existent-deal-id';
      const disputeId = mockDisputedDeal.disputes[0].id;
      const resolution = 'CUSTOMER_WIN';
      const moderatorId = mockModerator.id;

      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockModerator),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.resolveDispute(dealId, disputeId, resolution, moderatorId))
        .rejects.toThrow(new BadRequestException('Deal not found'));
    });

    it('should throw BadRequestException when dispute is not found', async () => {
      const dealId = mockDisputedDeal.id;
      const disputeId = 'non-existent-dispute-id';
      const resolution = 'CUSTOMER_WIN';
      const moderatorId = mockModerator.id;

      const mockPrisma = {
        deal: {
          findUnique: jest.fn().mockResolvedValue(mockDisputedDeal),
        },
        dispute: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockModerator),
          update: jest.fn(),
        },
      };

      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));

      await expect(service.resolveDispute(dealId, disputeId, resolution, moderatorId))
        .rejects.toThrow(new BadRequestException('Dispute not found'));
    });
  });
}); 