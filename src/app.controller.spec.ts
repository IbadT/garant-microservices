import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return "Hello World! Number: 1"', () => {
      jest.spyOn(appService, 'getHello').mockReturnValue('Hello World! Number: 1');
      expect(appController.getHello()).toBe('Hello World! Number: 1');
    });
  });

  describe('getError', () => {
    it('should return a success message object', () => {
      const result = appController.getError();
      expect(result).toEqual({
        message: "Sentry debug endpoint",
        status: "success"
      });
    });
  });
  
  // describe('getError', () => {
  //   it('should throw an error with specific message', () => {
  //     expect(() => appController.getError()).toThrow('My first Sentry error!');
  //     expect(() => appController.getError()).toThrow(Error);
  //   });
  // });
});
