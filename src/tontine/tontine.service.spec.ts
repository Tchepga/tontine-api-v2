import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotificationService } from 'src/notification/notification.service';
import { Role } from '../authentification/entities/roles/roles.enum';
import { User } from '../authentification/entities/user.entity';
import { MemberService } from '../member/member.service';
import {
  CreateConfigTontineDto,
  CreateTontineDto,
} from './dto/create-tontine.dto';
import { Currency } from './enum/shared';
import { StatusDeposit } from './enum/status-deposit';
import { SystemType } from './enum/system-type';
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

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  });

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
    getRepository: jest.fn().mockReturnValue(createMockRepository()),
  };

  const mockMemberService = {
    findByUsername: jest.fn(),
    buildUsernameForMember: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockNotificationService = {
    create: jest.fn(),
    notify: jest.fn(),
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
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<TontineService>(TontineService);
    memberService = module.get<MemberService>(MemberService);
    dataSource = module.get<DataSource>(DataSource);

    // Reset all mocks before each test
    jest.clearAllMocks();
    mockDataSource.getRepository.mockReturnValue(createMockRepository());
    mockDataSource.createQueryRunner.mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    });
  });

  describe('create', () => {
    it('should create a new tontine with members', async () => {
      const createTontineDto: CreateTontineDto = {
        title: 'Test Tontine',
        legacy: 'Test Legacy',
        currency: 'EUR',
        members: [
          {
            email: 'test@test.com',
            password: 'test',
            firstname: 'test',
            lastname: 'test',
            phone: 'test',
            country: 'FR',
          },
        ],
        config: {
          defaultLoanRate: 5,
          defaultLoanDuration: 30,
          loopPeriod: 'MONTHLY',
          minLoanAmount: 1000,
          countPersonPerMovement: 1,
          movementType: 'CUMULATIVE',
          countMaxMember: 10,
          systemType: SystemType.PART,
          rateMaps: [],
        },
      };

      const mockMember = {
        id: 1,
        user: { username: 'test', roles: ['TONTINARD'] },
      };

      mockMemberService.buildUsernameForMember.mockReturnValue('test.test');
      mockMemberService.findByUsername.mockResolvedValue(null);
      mockMemberService.create.mockResolvedValue(mockMember);
      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...entity,
        id: 1,
      }));

      const result = await service.create(createTontineDto);

      expect(result).toBeDefined();
      expect(result.title).toBe(createTontineDto.title);
      expect(result.members).toHaveLength(1);
    });
  });

  describe('getRapports', () => {
    it('should return all rapports for a tontine', async () => {
      const mockRapports = [
        { id: 1, title: 'Rapport 1' },
        { id: 2, title: 'Rapport 2' },
      ];

      mockDataSource.getRepository().find.mockResolvedValue(mockRapports);

      const result = await service.getRapports(1);
      expect(result).toEqual(mockRapports);
    });
  });

  describe('createDeposit', () => {
    it('should create a deposit and update cashflow', async () => {
      const mockTontine = {
        id: 1,
        cashFlow: { id: 1, amount: 1000 },
      };

      const mockMember = { id: 1 };
      const mockCashflow = { id: 1, amount: 1000, deposits: [] };
      const mockDeposit = {
        amount: 500,
        memberId: 1,
        reasons: 'Test deposit',
        currency: Currency.EUR,
        cashFlowId: 1,
        status: StatusDeposit.PENDING,
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);
      mockMemberService.findOne.mockResolvedValue(mockMember);
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(mockCashflow),
        save: jest.fn().mockImplementation((entity) => ({ ...entity, id: 1 })),
        remove: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      });
      // Premier findOne = author (Member), suivants = CashFlow
      mockDataSource
        .getRepository()
        .findOne.mockResolvedValueOnce(mockMember)
        .mockResolvedValue(mockCashflow);

      const mockUser = {
        username: 'testuser',
        password: 'secret',
        roles: [Role.TONTINARD],
      } as User;

      const result = await service.createDeposit(
        1,
        mockDeposit,
        StatusDeposit.APPROVED,
        mockUser,
      );

      expect(result).toBeDefined();
      expect(mockDataSource.getRepository().save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tontine not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.createDeposit(
          1,
          {
            amount: 500,
            memberId: 1,
            reasons: 'Test',
            currency: Currency.EUR,
            cashFlowId: 1,
            status: StatusDeposit.PENDING,
          },
          StatusDeposit.PENDING,
          {
            username: 'testuser',
            password: 'secret',
            roles: [Role.TONTINARD],
          } as User,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateConfig', () => {
    it('should update tontine config', async () => {
      const mockTontine = {
        id: 1,
        config: { id: 1 },
      };

      const mockConfig = {
        id: 1,
        defaultLoanRate: 5,
      };

      const updateConfigDto: CreateConfigTontineDto = {
        defaultLoanRate: 10,
        defaultLoanDuration: 30,
        loopPeriod: 'MONTHLY',
        minLoanAmount: 1000,
        countPersonPerMovement: 1,
        movementType: 'CUMULATIVE',
        countMaxMember: 10,
        systemType: SystemType.PART,
        rateMaps: [],
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);
      mockDataSource.getRepository().findOne.mockResolvedValue(mockConfig);
      mockDataSource
        .getRepository()
        .save.mockImplementation((entity) => entity);

      const result = await service.updateConfig(1, updateConfigDto);

      expect(result).toBeDefined();
      expect(result.defaultLoanRate).toBe(updateConfigDto.defaultLoanRate);
    });
  });

  // ... autres tests existants ...
});
