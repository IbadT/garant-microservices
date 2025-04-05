import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { PrismaService } from 'src/prisma.service';

describe('DisputesService', () => {
  let service: DisputesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation((callback) => callback({
              dispute: {
                delete: jest.fn().mockResolvedValue({ id: 'test-id', deal_id: 'deal-id' }),
                create: jest.fn().mockResolvedValue({ 
                  id: 'new-dispute-id', 
                  deal_id: 'deal-id', 
                  opened_by: 'user-id', 
                  opened_by_role: 'CUSTOMER', 
                  reason: 'Test reason' 
                }),
              },
              deal: {
                findUnique: jest.fn().mockResolvedValue({ 
                  id: 'deal-id', 
                  customer_id: 'user-id', 
                  vendor_id: 'vendor-id' 
                }),
                update: jest.fn().mockResolvedValue({ 
                  id: 'deal-id', 
                  status: 'DISPUTED' 
                }),
              },
            })),
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
      const result = await service.deleteDispute('test-id');
      expect(result).toEqual({ id: 'test-id', deal_id: 'deal-id' });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('openDispute', () => {
    it('should open a dispute for a customer', async () => {
      const result = await service.openDispute('deal-id', 'user-id', 'Test reason');
      expect(result).toEqual({ 
        id: 'new-dispute-id', 
        deal_id: 'deal-id', 
        opened_by: 'user-id', 
        opened_by_role: 'CUSTOMER', 
        reason: 'Test reason' 
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should open a dispute for a vendor', async () => {
      // Мокаем findUnique для возврата другой сделки
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        dispute: {
          create: jest.fn().mockResolvedValue({ 
            id: 'new-dispute-id', 
            deal_id: 'deal-id', 
            opened_by: 'vendor-id', 
            opened_by_role: 'VENDOR', 
            reason: 'Test reason' 
          }),
        },
        deal: {
          findUnique: jest.fn().mockResolvedValue({ 
            id: 'deal-id', 
            customer_id: 'customer-id', 
            vendor_id: 'vendor-id' 
          }),
          update: jest.fn().mockResolvedValue({ 
            id: 'deal-id', 
            status: 'DISPUTED' 
          }),
        },
      }));
      
      prismaService.$transaction = mockTransaction;
      
      const result = await service.openDispute('deal-id', 'vendor-id', 'Test reason');
      expect(result).toEqual({ 
        id: 'new-dispute-id', 
        deal_id: 'deal-id', 
        opened_by: 'vendor-id', 
        opened_by_role: 'VENDOR', 
        reason: 'Test reason' 
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw an error if deal not found', async () => {
      // Мокаем findUnique для возврата null
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        dispute: {
          create: jest.fn(),
        },
        deal: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
      }));
      
      prismaService.$transaction = mockTransaction;
      
      await expect(service.openDispute('non-existent-deal', 'user-id', 'Test reason'))
        .rejects.toThrow('Deal not found');
    });

    it('should throw an error if user is not a participant', async () => {
      // Мокаем findUnique для возврата сделки, где пользователь не участник
      const mockTransaction = jest.fn().mockImplementation((callback) => callback({
        dispute: {
          create: jest.fn(),
        },
        deal: {
          findUnique: jest.fn().mockResolvedValue({ 
            id: 'deal-id', 
            customer_id: 'customer-id', 
            vendor_id: 'vendor-id' 
          }),
          update: jest.fn(),
        },
      }));
      
      prismaService.$transaction = mockTransaction;
      
      await expect(service.openDispute('deal-id', 'non-participant-id', 'Test reason'))
        .rejects.toThrow('Not a participant');
    });
  });
});
