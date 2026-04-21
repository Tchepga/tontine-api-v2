import { Test, TestingModule } from '@nestjs/testing';
import { AuthentificationController } from './authentification.controller';
import { mockProviders } from '../testing.helpers';
import { AuthentificationService } from './authentification.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthentificationController', () => {
  let controller: AuthentificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthentificationController],
      providers: [...mockProviders, AuthentificationService, JwtService],
    }).compile();

    controller = module.get<AuthentificationController>(
      AuthentificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
