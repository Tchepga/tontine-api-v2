import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthentificationController } from './authentification.controller';
import { AuthentificationService } from './authentification.service';

describe('AuthentificationController', () => {
  let controller: AuthentificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthentificationController],
      providers: [
        {
          provide: AuthentificationService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            verify: jest.fn(),
            getUserByUsername: jest.fn(),
            changePassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthentificationController>(
      AuthentificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
