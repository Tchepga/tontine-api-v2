import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MemberService } from './member.service';
import { AuthentificationService } from '../authentification/authentification.service';
import { MailService } from '../mail/mail.service';
import { HttpException } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { Role } from '../authentification/entities/roles/roles.enum';

describe('MemberService', () => {
  let service: MemberService;
  let authService: AuthentificationService;
  let dataSource: DataSource;

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    }),
    getRepository: jest.fn().mockReturnValue({
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    }),
  };

  const mockAuthService = {
    findByUsername: jest.fn(),
    register: jest.fn(),
  };

  const mockMailService = {
    sendRegistrationWelcomeEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: AuthentificationService,
          useValue: mockAuthService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    authService = module.get<AuthentificationService>(AuthentificationService);
    dataSource = module.get<DataSource>(DataSource);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildUsernameForMember', () => {
    it('should build normalized username from firstname and lastname', () => {
      expect(service.buildUsernameForMember('Jean', 'Dupont')).toBe(
        'jean.dupont',
      );
      expect(service.buildUsernameForMember('Élodie', 'Müller')).toBe(
        'elodie.muller',
      );
    });
  });

  describe('create', () => {
    const mockCreateMemberDto: CreateMemberDto = {
      email: 'test@test.com',
      password: 'password',
      firstname: 'Test',
      lastname: 'User',
      phone: '1234567890',
      country: 'FR',
    };

    it('should create a new member with auto-generated username', async () => {
      const mockUser = {
        username: 'test.user',
        roles: ['TONTINARD'],
      };

      mockAuthService.findByUsername.mockResolvedValue(null);
      mockAuthService.register.mockResolvedValue(mockUser);
      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...entity,
        id: 1,
      }));

      const result = await service.create(mockCreateMemberDto);

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.firstname).toBe(mockCreateMemberDto.firstname);
      expect(result.lastname).toBe(mockCreateMemberDto.lastname);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'test.user' }),
      );
    });

    it('should trim firstname and lastname before generating username', async () => {
      const mockUser = {
        username: 'test.user',
        roles: ['TONTINARD'],
      };

      mockAuthService.findByUsername.mockResolvedValue(null);
      mockAuthService.register.mockResolvedValue(mockUser);
      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...entity,
        id: 1,
      }));

      await service.create({
        ...mockCreateMemberDto,
        firstname: '  Test  ',
        lastname: '  User  ',
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'test.user' }),
      );
    });

    it('should send welcome email for president registration when email is valid', async () => {
      const mockUser = {
        username: 'test.user',
        roles: ['PRESIDENT'],
      };

      mockAuthService.findByUsername.mockResolvedValue(null);
      mockAuthService.register.mockResolvedValue(mockUser);
      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...entity,
        id: 1,
      }));

      const result = await service.create({
        ...mockCreateMemberDto,
        roles: [Role.PRESIDENT],
      });

      expect(mockMailService.sendRegistrationWelcomeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          username: 'test.user',
        }),
      );
      expect(result.emailSent).toBe(true);
    });

    it('should add numeric suffix when username already exists', async () => {
      const mockUser = {
        username: 'test.user2',
        roles: ['TONTINARD'],
      };

      mockAuthService.findByUsername
        .mockResolvedValueOnce({ username: 'test.user' })
        .mockResolvedValueOnce(null);
      mockAuthService.register.mockResolvedValue(mockUser);
      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...entity,
        id: 1,
      }));

      const result = await service.create(mockCreateMemberDto);

      expect(result.user.username).toBe('test.user2');
      expect(mockAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'test.user2' }),
      );
    });

    it('should throw error if user creation fails', async () => {
      mockAuthService.findByUsername.mockResolvedValue(null);
      mockAuthService.register.mockRejectedValue(
        new Error('User creation failed'),
      );

      await expect(service.create(mockCreateMemberDto)).rejects.toThrow();
    });
  });

  describe('findByUsername', () => {
    it('should return member by username', async () => {
      const mockMember = {
        id: 1,
        firstname: 'Test',
        lastname: 'User',
        user: { username: 'test' },
      };

      mockAuthService.findByUsername.mockResolvedValue({ username: 'test' });
      mockQueryBuilder.getOne.mockResolvedValue(mockMember);

      const result = await service.findByUsername('test');
      expect(result).toEqual(mockMember);
    });

    it('should return null if member not found', async () => {
      mockAuthService.findByUsername.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return member by id', async () => {
      const mockMember = {
        id: 1,
        firstname: 'Test',
        lastname: 'User',
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockMember);

      const result = await service.findOne(1);
      expect(result).toEqual(mockMember);
    });

    it('should throw error if member not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update member', async () => {
      const mockMember = {
        id: 1,
        firstname: 'Test',
        lastname: 'User',
      };

      const updateDto = {
        firstname: 'Updated',
        lastname: 'Name',
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockMember);
      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...mockMember,
        ...entity,
      }));

      const result = await service.update(1, updateDto);

      expect(result.firstname).toBe(updateDto.firstname);
      expect(result.lastname).toBe(updateDto.lastname);
    });

    it('should throw error if member not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(service.update(999, { firstname: 'Test' })).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('remove', () => {
    it('should deactivate member', async () => {
      const mockMember = {
        id: 1,
        firstname: 'Test',
        lastname: 'User',
        isActive: true,
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockMember);
      mockDataSource.getRepository().save.mockImplementation((entity) => entity);

      await service.remove(1);

      expect(mockDataSource.getRepository().save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw error if member not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(HttpException);
    });
  });
});
