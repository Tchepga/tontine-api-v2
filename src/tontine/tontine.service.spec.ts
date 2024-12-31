import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Role } from '../authentification/entities/roles/roles.enum';
import { MemberService } from '../member/member.service';
import { TontineService } from './tontine.service';

describe('TontineService', () => {
  let service: TontineService;
  let memberService: MemberService;
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

  const mockMemberService = {
    findByUsername: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TontineService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: MemberService,
          useValue: mockMemberService,
        },
      ],
    }).compile();

    service = module.get<TontineService>(TontineService);
    memberService = module.get<MemberService>(MemberService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByMember', () => {
    it('should return empty array when member not found', async () => {
      mockMemberService.findByUsername.mockResolvedValue(null);
      const result = await service.findByMember('username');
      expect(result).toEqual([]);
    });

    it('should return tontines when member exists', async () => {
      const mockMember = { id: 1, username: 'test' };
      const mockTontines = [
        { id: 1, members: [mockMember] },
        { id: 2, members: [mockMember] },
      ];

      mockMemberService.findByUsername.mockResolvedValue(mockMember);
      mockDataSource.getRepository().find.mockResolvedValue(mockTontines);

      const result = await service.findByMember('username');
      expect(result).toEqual(mockTontines);
    });
  });

  describe('findOne', () => {
    it('should return a tontine by id', async () => {
      const mockTontine = { id: 1, title: 'Test Tontine' };
      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);

      const result = await service.findOne(1);
      expect(result).toEqual(mockTontine);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('tontine.id = :id', {
        id: 1,
      });
    });
  });

  describe('createRapport', () => {
    it('should create a rapport', async () => {
      const mockTontine = {
        id: 1,
        members: [{ id: 1, user: { username: 'test' } }],
      };
      const mockRapport = {
        title: 'Test Rapport',
        content: 'Test Content',
      };
      const mockFile = [{ filename: 'test.pdf' }];

      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);
      mockDataSource.getRepository().save.mockResolvedValue({
        ...mockRapport,
        id: 1,
      });

      const result = await service.createRapport(
        1,
        'test',
        mockRapport,
        mockFile,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(mockRapport.title);
    });

    it('should throw error when tontine not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.createRapport(
          1,
          'test',
          { title: 'test', content: 'test' },
          [],
        ),
      ).rejects.toThrow('Tontine not found');
    });
  });

  describe('getMemberRole', () => {
    it('should return member role', async () => {
      const mockRole = {
        id: 1,
        user: { username: 'test' },
        tontine: { id: 1 },
        role: Role.PRESIDENT,
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockRole);

      const result = await service.getMemberRole('test', 1);
      expect(result).toEqual(mockRole);
    });
  });

  describe('addMemberWithRole', () => {
    it('should add member with role', async () => {
      const mockTontine = { id: 1 };
      const mockUser = { username: 'test' };
      const mockRole = Role.TONTINARD;

      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);
      mockDataSource.getRepository().findOne.mockResolvedValue(mockUser);
      mockDataSource
        .getRepository()
        .save.mockImplementation((entity) => entity);

      const result = await service.addMemberWithRole(1, 'test', mockRole);

      expect(result).toBeDefined();
      expect(result.role).toBe(mockRole);
      expect(result.tontine).toEqual(mockTontine);
      expect(result.user).toEqual(mockUser);
    });
  });
});
