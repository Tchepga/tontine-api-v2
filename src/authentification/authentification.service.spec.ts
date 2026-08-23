import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthentificationService } from './authentification.service';
import { MailService } from 'src/mail/mail.service';
import { ErrorCode } from 'src/shared/utilities/error-code';

describe('AuthentificationService', () => {
  let service: AuthentificationService;
  let entityManager: { query: jest.Mock };
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(async () => {
    entityManager = { query: jest.fn() };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthentificationService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn().mockReturnValue({
              findOne: jest.fn(),
              save: jest.fn(),
            }),
          },
        },
        { provide: JwtService, useValue: jwtService },
        { provide: EntityManager, useValue: entityManager },
        {
          provide: MailService,
          useValue: {
            isConfigured: jest.fn().mockReturnValue(false),
            sendPasswordResetEmail: jest.fn(),
          },
        },
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
      jest.spyOn(service['dataSource'].getRepository(Object), 'findOne').mockResolvedValue({
        username: 'alice',
        roles: ['TONTINARD'],
        mustChangePassword: true,
      } as any);
      entityManager.query.mockResolvedValue([{ password: hashed }]);

      const result = await service.login('alice', 'secret123');

      expect(result).toEqual({
        token: 'jwt-token',
        mustChangePassword: true,
      });
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('retourne mustChangePassword=false par défaut', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      jest.spyOn(service['dataSource'].getRepository(Object), 'findOne').mockResolvedValue({
        username: 'bob',
        roles: ['TONTINARD'],
        mustChangePassword: false,
      } as any);
      entityManager.query.mockResolvedValue([{ password: hashed }]);

      const result = await service.login('bob', 'pass');

      expect(result).toEqual({
        token: 'jwt-token',
        mustChangePassword: false,
      });
    });

    it('rejette identifiants invalides', async () => {
      jest.spyOn(service['dataSource'].getRepository(Object), 'findOne').mockResolvedValue(null);
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
      jest.spyOn(service['dataSource'].getRepository(Object), 'findOne').mockResolvedValue({
        username: 'alice',
        roles: ['TONTINARD'],
      } as any);
      entityManager.query.mockResolvedValue([{ password: hashed }]);

      await expect(service.login('alice', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
