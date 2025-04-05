import { Test, TestingModule } from '@nestjs/testing';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

describe('DisputesController', () => {
  let controller: DisputesController;
  let service: DisputesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [
        {
          provide: DisputesService,
          useValue: {
            deleteDispute: jest.fn().mockResolvedValue({ id: 'test-id', deal_id: 'deal-id' }),
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

  describe('remove', () => {
    it('should delete a dispute', async () => {
      const result = await controller.remove('test-id');
      expect(result).toEqual({ id: 'test-id', deal_id: 'deal-id' });
      expect(service.deleteDispute).toHaveBeenCalledWith('test-id');
    });
  });
});
