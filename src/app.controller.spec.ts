import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockImplementation((num: number) => `Hello World! Number: ${num}`),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return "Hello World! Number: 1"', () => {
      const result = appController.getHello();
      expect(result).toBe('Hello World! Number: 1');
      expect(appService.getHello).toHaveBeenCalledWith(1);
    });
  });

  describe('getError', () => {
    it('should throw an error with specific message', () => {
      expect(() => appController.getError()).toThrow('My first Sentry error!');
      expect(() => appController.getError()).toThrow(Error);
    });
  });
});
