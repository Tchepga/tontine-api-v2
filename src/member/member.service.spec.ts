import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AuthentificationService } from '../authentification/authentification.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberService } from './member.service';

describe('MemberService', () => {
  let service: MemberService;

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
    create: jest.fn(),
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
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    authService = module.get<AuthentificationService>(AuthentificationService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new member', async () => {
      const mockCreateMemberDto: CreateMemberDto = {
        username: 'test',
        email: 'test@test.com',
        password: 'password',
        firstname: 'Test',
        lastname: 'User',
        phone: '1234567890',
        country: 'FR',
      };

      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
      };

      mockAuthService.create.mockResolvedValue(mockUser);
      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...entity,
        id: 1,
      }));

      const result = await service.create(mockCreateMemberDto);

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.firstname).toBe(mockCreateMemberDto.firstname);
      expect(result.lastname).toBe(mockCreateMemberDto.lastname);
    });

    it('should throw error if user creation fails', async () => {
      const mockCreateMemberDto = {
        username: 'test',
        email: 'test@test.com',
        password: 'password',
        firstname: 'Test',
        lastname: 'User',
        phone: '1234567890',
        country: 'FR',
      };

      mockAuthService.create.mockRejectedValue(
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

      mockDataSource.getRepository().findOne.mockResolvedValue(mockMember);

      const result = await service.findByUsername('test');
      expect(result).toEqual(mockMember);
    });

    it('should return null if member not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

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
    it('should remove member', async () => {
      const mockMember = {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockMember);
      mockDataSource.getRepository().remove.mockResolvedValue(mockMember);

      const result = await service.remove(1);
      expect(result).toEqual(mockMember);
    });

    it('should throw error if member not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(HttpException);
    });
  });
});
