import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthentificationService } from './authentification.service';
import { MailService } from 'src/mail/mail.service';
import { ErrorCode } from 'src/shared/utilities/error-code';
import { User } from './entities/user.entity';
import { Member } from 'src/member/entities/member.entity';

describe('AuthentificationService', () => {
  let service: AuthentificationService;
  let entityManager: { query: jest.Mock };
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };
  let userRepo: { findOne: jest.Mock; save: jest.Mock };
  let memberRepo: { findOne: jest.Mock; save: jest.Mock };
  let mailService: {
    isConfigured: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };
  let mockDataSource: { getRepository: jest.Mock };

  const genericForgotMessage =
    'Si un compte existe pour cet identifiant, un email de réinitialisation a été envoyé.';

  beforeEach(async () => {
    entityManager = { query: jest.fn() };
    jwtService = {
      sign: jest.fn().mockReturnValue('reset-jwt-token'),
      verifyAsync: jest.fn(),
    };
    userRepo = { findOne: jest.fn(), save: jest.fn() };
    memberRepo = { findOne: jest.fn(), save: jest.fn() };
    mailService = {
      isConfigured: jest.fn().mockReturnValue(false),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };
    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === User) {
          return userRepo;
        }
        if (entity === Member) {
          return memberRepo;
        }
        return { findOne: jest.fn(), save: jest.fn() };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthentificationService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: JwtService, useValue: jwtService },
        { provide: EntityManager, useValue: entityManager },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthentificationService>(AuthentificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('retourne token et mustChangePassword=true', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      userRepo.findOne.mockResolvedValue({
        username: 'alice',
        roles: ['TONTINARD'],
        mustChangePassword: true,
      } as any);
      entityManager.query.mockResolvedValue([{ password: hashed }]);

      const result = await service.login('alice', 'secret123');

      expect(result).toEqual({
        token: 'reset-jwt-token',
        mustChangePassword: true,
      });
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('retourne mustChangePassword=false par défaut', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      userRepo.findOne.mockResolvedValue({
        username: 'bob',
        roles: ['TONTINARD'],
        mustChangePassword: false,
      } as any);
      entityManager.query.mockResolvedValue([{ password: hashed }]);

      const result = await service.login('bob', 'pass');

      expect(result).toEqual({
        token: 'reset-jwt-token',
        mustChangePassword: false,
      });
    });

    it('rejette identifiants invalides', async () => {
      userRepo.findOne.mockResolvedValue(null);
      entityManager.query.mockResolvedValue([]);

      await expect(service.login('unknown', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login('unknown', 'wrong')).rejects.toMatchObject({
        response: { message: ErrorCode.INVALID_CREDENTIAL },
      });
    });

    it('rejette mot de passe incorrect', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      userRepo.findOne.mockResolvedValue({
        username: 'alice',
        roles: ['TONTINARD'],
      } as any);
      entityManager.query.mockResolvedValue([{ password: hashed }]);

      await expect(service.login('alice', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('retourne un message générique si identifiant inconnu', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@example.com');

      expect(result).toEqual({ message: genericForgotMessage });
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('résout par username et envoie un email si membre trouvé', async () => {
      userRepo.findOne.mockResolvedValue({ username: 'alice.dupont' } as User);
      memberRepo.findOne.mockResolvedValue({
        email: 'alice@example.com',
      } as Member);
      mailService.isConfigured.mockReturnValue(true);

      const result = await service.forgotPassword('alice.dupont');

      expect(result).toEqual({
        message: genericForgotMessage,
        emailSent: true,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { username: 'alice.dupont', purpose: 'password-reset' },
        { expiresIn: '1h' },
      );
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: 'alice@example.com',
        username: 'alice.dupont',
        resetToken: 'reset-jwt-token',
      });
      expect(memberRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('résout par email via Member si username direct introuvable', async () => {
      userRepo.findOne.mockResolvedValue(null);
      memberRepo.findOne
        .mockResolvedValueOnce({
          user: { username: 'bob.martin' },
        } as Member)
        .mockResolvedValueOnce({
          email: 'bob@example.com',
        } as Member);
      mailService.isConfigured.mockReturnValue(true);

      const result = await service.forgotPassword('bob@example.com');

      expect(result).toEqual({
        message: genericForgotMessage,
        emailSent: true,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { username: 'bob.martin', purpose: 'password-reset' },
        { expiresIn: '1h' },
      );
      expect(memberRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('ne tente pas la recherche par email si le format est invalide', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword('not-an-email');

      expect(result).toEqual({ message: genericForgotMessage });
      expect(memberRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('réinitialise le mot de passe avec un token valide', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        username: 'alice',
        purpose: 'password-reset',
      });
      userRepo.findOne.mockResolvedValue({
        username: 'alice',
        password: 'old-hash',
        mustChangePassword: true,
      } as User);
      userRepo.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newSecret123',
      });

      expect(result).toEqual({ success: true });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'alice',
          mustChangePassword: false,
        }),
      );
    });

    it('rejette un token invalide ou expiré', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(
        service.resetPassword({
          token: 'bad-token',
          newPassword: 'newSecret123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette un token sans purpose password-reset', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        username: 'alice',
        purpose: 'login',
      });

      await expect(
        service.resetPassword({
          token: 'wrong-purpose',
          newPassword: 'newSecret123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si utilisateur introuvable', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        username: 'ghost',
        purpose: 'password-reset',
      });
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'valid-token',
          newPassword: 'newSecret123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
