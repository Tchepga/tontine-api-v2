import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { TontineStatus } from './enum/tontine-status';
import { TontineService } from './tontine.service';
import { ErrorCode } from '../shared/utilities/error-code';

describe('TontineService', () => {
  let service: TontineService;
  let memberService: MemberService;
  let dataSource: DataSource;

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
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

      mockQueryBuilder.getOne.mockResolvedValue({
        id: 1,
        members: [{ user: { username: 'testuser' } }],
      });
      mockDataSource.getRepository().find.mockResolvedValue(mockRapports);

      const result = await service.getRapports(1, 'testuser');
      expect(result).toEqual(mockRapports);
    });
  });

  describe('createDeposit', () => {
    it('should create a deposit and update cashflow', async () => {
      const mockTontine = {
        id: 1,
        cashFlow: { id: 1, amount: 1000 },
        members: [{ user: { username: 'testuser' } }],
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

  describe('closeTontine', () => {
    it('should close an active tontine and snapshot member shares', async () => {
      const mockTontine = {
        id: 1,
        status: TontineStatus.ACTIVE,
        closedAt: null,
        closureSnapshot: null,
        cashFlow: { id: 10, amount: 3000, currency: 'EUR', dividendes: 0 },
        members: [
          { id: 1, firstname: 'Alice', lastname: 'A' },
          { id: 2, firstname: 'Bob', lastname: 'B' },
        ],
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([
          {
            status: StatusDeposit.APPROVED,
            amount: 2000,
            author: { id: 1 },
          },
          {
            status: StatusDeposit.APPROVED,
            amount: 1000,
            author: { id: 2 },
          },
        ]),
        findOne: jest.fn(),
        save: jest.fn().mockImplementation((entity) => entity),
        remove: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      const result = await service.closeTontine(1);

      expect(result.tontine.status).toBe(TontineStatus.CLOSED);
      expect(result.closureSummary.remainingBalance).toBe(3000);
      expect(result.closureSummary.memberShares).toHaveLength(2);
      expect(result.closureSummary.memberShares[0].shareAmount).toBe(2000);
      expect(result.closureSummary.memberShares[1].shareAmount).toBe(1000);
    });

    it('should reject closing an already closed tontine', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 1,
        status: TontineStatus.CLOSED,
      });

      await expect(service.closeTontine(1)).rejects.toMatchObject({
        response: { errorCode: ErrorCode.TONTINE_ALREADY_CLOSED },
      });
    });
  });

  describe('getClosureSummary', () => {
    it('should return closure summary for closed tontine', async () => {
      const closedAt = new Date('2026-01-01T00:00:00.000Z');
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 1,
        status: TontineStatus.CLOSED,
        closedAt,
        closureSnapshot: {
          remainingBalance: 500,
          currency: 'EUR',
          cashflowAmount: 500,
          dividendes: 0,
          memberShares: [],
        },
        members: [{ user: { username: 'member.one' } }],
      });

      const result = await service.getClosureSummary(1, 'member.one');

      expect(result.tontineId).toBe(1);
      expect(result.closedAt).toEqual(closedAt);
      expect(result.remainingBalance).toBe(500);
    });

    it('should reject summary for active tontine', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 1,
        status: TontineStatus.ACTIVE,
        members: [{ user: { username: 'member.one' } }],
      });

      await expect(
        service.getClosureSummary(1, 'member.one'),
      ).rejects.toMatchObject({
        response: { errorCode: ErrorCode.TONTINE_NOT_CLOSED },
      });
    });
  });

  describe('restartTontine', () => {
    it('should create a new active tontine with carry-over cash', async () => {
      const sourceTontine = {
        id: 1,
        title: 'Tontine A',
        legacy: 'legacy',
        status: TontineStatus.CLOSED,
        config: { id: 5 },
        cashFlow: { currency: 'EUR' },
        closureSnapshot: { remainingBalance: 1200 },
        members: [
          {
            id: 1,
            user: { username: 'alice.a' },
          },
        ],
      };

      mockQueryBuilder.getOne
        .mockResolvedValueOnce(sourceTontine)
        .mockResolvedValueOnce({
          id: 99,
          title: 'Tontine A (suite)',
          status: TontineStatus.ACTIVE,
          parentTontineId: 1,
          members: sourceTontine.members,
        });

      const managerSave = jest
        .fn()
        .mockImplementation((entity) => ({ ...entity, id: entity instanceof Object ? 99 : 99 }));
      const memberRoleRepo = {
        find: jest.fn().mockResolvedValue([
          { user: { username: 'alice.a' }, role: Role.PRESIDENT },
        ]),
        save: jest.fn().mockImplementation((entity) => entity),
      };

      mockDataSource.createQueryRunner.mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: managerSave,
          getRepository: jest.fn().mockReturnValue(memberRoleRepo),
        },
      });

      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({
          id: 5,
          defaultLoanRate: 5,
          defaultLoanDuration: 30,
          loopPeriod: 'MONTHLY',
          minLoanAmount: 100,
          countPersonPerMovement: 1,
          movementType: 'ROTATIVE',
          countMaxMember: 12,
          systemType: SystemType.PART,
          rateMaps: [],
        }),
        save: jest.fn(),
        remove: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      const result = await service.restartTontine(1, { carryOverCash: true });

      expect(result.status).toBe(TontineStatus.ACTIVE);
      expect(result.parentTontineId).toBe(1);
      expect(managerSave).toHaveBeenCalled();
    });

    it('should reject restart for active tontine', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 1,
        status: TontineStatus.ACTIVE,
      });

      await expect(service.restartTontine(1, {})).rejects.toMatchObject({
        response: { errorCode: ErrorCode.TONTINE_NOT_CLOSED },
      });
    });
  });

  describe('getMembersContributions', () => {
    const mockTontine = {
      id: 1,
      status: TontineStatus.ACTIVE,
      cashFlow: { id: 10, amount: 3000 },
      members: [
        {
          id: 1,
          firstname: 'Alice',
          lastname: 'A',
          user: { username: 'alice.a' },
        },
        {
          id: 2,
          firstname: 'Bob',
          lastname: 'B',
          user: { username: 'bob.b' },
        },
        {
          id: 3,
          firstname: 'Charlie',
          lastname: 'C',
          user: { username: 'charlie.c' },
        },
      ],
    };

    it('should return contributions and shares for all members', async () => {
      const lastDepositDate = new Date('2026-03-01T12:00:00.000Z');

      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([
          {
            status: StatusDeposit.APPROVED,
            amount: 2000,
            creationDate: new Date('2026-01-01T00:00:00.000Z'),
            author: { id: 1, user: { username: 'alice.a' } },
          },
          {
            status: StatusDeposit.APPROVED,
            amount: 1000,
            creationDate: lastDepositDate,
            author: { id: 2, user: { username: 'bob.b' } },
          },
          {
            status: StatusDeposit.PENDING,
            amount: 500,
            creationDate: new Date('2026-02-01T00:00:00.000Z'),
            author: { id: 2, user: { username: 'bob.b' } },
          },
          {
            status: StatusDeposit.REJECTED,
            amount: 200,
            creationDate: new Date('2026-02-15T00:00:00.000Z'),
            author: { id: 1, user: { username: 'alice.a' } },
          },
        ]),
        findOne: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      const result = await service.getMembersContributions(1, 'alice.a');

      expect(result).toHaveLength(3);

      expect(result[0]).toMatchObject({
        memberId: 1,
        firstname: 'Alice',
        lastname: 'A',
        username: 'alice.a',
        totalApproved: 2000,
        totalPending: 0,
        totalRejected: 200,
        depositCount: 2,
        shareAmount: 2000,
        sharePercent: 66.67,
      });
      expect(result[0].lastDeposit).toBe('2026-02-15T00:00:00.000Z');

      expect(result[1]).toMatchObject({
        memberId: 2,
        totalApproved: 1000,
        totalPending: 500,
        totalRejected: 0,
        depositCount: 2,
        shareAmount: 1000,
        sharePercent: 33.33,
      });
      expect(result[1].lastDeposit).toBe(lastDepositDate.toISOString());

      expect(result[2]).toMatchObject({
        memberId: 3,
        firstname: 'Charlie',
        totalApproved: 0,
        totalPending: 0,
        totalRejected: 0,
        depositCount: 0,
        lastDeposit: null,
        shareAmount: 0,
        sharePercent: 0,
      });
    });

    it('should split equally when no approved deposits', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([
          {
            status: StatusDeposit.PENDING,
            amount: 500,
            creationDate: new Date('2026-02-01T00:00:00.000Z'),
            author: { id: 1, user: { username: 'alice.a' } },
          },
        ]),
        findOne: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      const result = await service.getMembersContributions(1, 'alice.a');

      expect(result).toHaveLength(3);
      result.forEach((member) => {
        expect(member.shareAmount).toBe(1000);
        expect(member.sharePercent).toBeCloseTo(33.33, 2);
      });
    });

    it('should work on closed tontine', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockTontine,
        status: TontineStatus.CLOSED,
      });
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      const result = await service.getMembersContributions(1, 'alice.a');

      expect(result).toHaveLength(3);
      expect(result[0].shareAmount).toBe(1000);
    });

    it('should reject non-member', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTontine);

      await expect(
        service.getMembersContributions(1, 'unknown.user'),
      ).rejects.toThrow('Vous n\'êtes pas membre de cette tontine.');
    });
  });

  describe('assertTontineWritable', () => {
    it('should block writes on closed tontine', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 1,
        status: TontineStatus.CLOSED,
      });

      await expect(service.assertTontineWritable(1)).rejects.toMatchObject({
        response: { errorCode: ErrorCode.TONTINE_CLOSED },
      });
    });
  });
});
