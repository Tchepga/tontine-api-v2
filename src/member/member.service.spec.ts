import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberService } from './member.service';
import { mockProviders, mockAuthentificationService, mockDataSource } from '../testing.helpers';

describe('MemberService', () => {
  let service: MemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberService, ...mockProviders],
    }).compile();

    service = module.get<MemberService>(MemberService);
    jest.clearAllMocks();
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
        roles: [],
        password: 'hashedpassword'
      };

      mockAuthentificationService.register.mockResolvedValue(mockUser);
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

      mockAuthentificationService.register.mockRejectedValue(
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

      mockAuthentificationService.findByUsername.mockResolvedValue(mockMember.user as any);
      mockDataSource.getRepository().createQueryBuilder().getOne.mockResolvedValue(mockMember);

      const result = await service.findByUsername('test');
      expect(result).toEqual(mockMember);
    });

    it('should return null if member not found', async () => {
      mockAuthentificationService.findByUsername.mockResolvedValue(null);

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
      mockDataSource.getRepository().save.mockImplementation((entity) => Promise.resolve({
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
        isActive: true,
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockMember);
      mockDataSource.getRepository().save.mockResolvedValue({ ...mockMember, isActive: false });

      await service.remove(1);
      expect(mockDataSource.getRepository().save).toHaveBeenCalledWith({ ...mockMember, isActive: false });
    });

    it('should throw error if member not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(HttpException);
    });
  });
});