import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthentificationController } from './authentification.controller';
import { AuthentificationService } from './authentification.service';

describe('AuthentificationController', () => {
  let controller: AuthentificationController;
  let authService: {
    login: jest.Mock;
    register: jest.Mock;
    verify: jest.Mock;
    getUserByUsername: jest.Mock;
    changePassword: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
      verify: jest.fn(),
      getUserByUsername: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthentificationController],
      providers: [
        {
          provide: AuthentificationService,
          useValue: authService,
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

  describe('forgotPassword', () => {
    it('transmet usernameOrEmail au service', async () => {
      authService.forgotPassword.mockResolvedValue({ message: 'ok' });

      await controller.forgotPassword({ usernameOrEmail: 'alice@example.com' });

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'alice@example.com',
      );
    });
  });

  describe('resetPassword', () => {
    it('transmet token et newPassword au service', async () => {
      authService.resetPassword.mockResolvedValue({ success: true });

      const dto = { token: 'reset-token', newPassword: 'secret123456' };
      await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });
});
