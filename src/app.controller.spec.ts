import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getParam', () => {
    it('should return an object', () => {
      expect(appController.getParam()).toBeDefined();
      expect(appController.getParam()).toBeInstanceOf(Object);
    });
  });

  describe('health', () => {
    it('should return an object', () => {
      expect(appController.health()).toBeDefined();
      expect(appController.health()).toBeInstanceOf(Object);
    });
  });
});
