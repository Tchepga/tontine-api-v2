import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TontineService } from './tontine.service';
import { Tontine } from './entities/tontine.entity';
import { Repository } from 'typeorm';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { StatusDeposit } from './enum/status-deposit';
import { NotFoundException } from '@nestjs/common';
import { Currency } from './enum/shared';
import { SystemType } from './enum/system-type';
import { Role } from '../authentification/entities/roles/roles.enum';

describe('TontineService', () => {
  let service: TontineService;
  let tontineRepository: Repository<Tontine>;

  const mockTontineRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TontineService,
        {
          provide: getRepositoryToken(Tontine),
          useValue: mockTontineRepository,
        },
      ],
    }).compile();

    service = module.get<TontineService>(TontineService);
    tontineRepository = module.get<Repository<Tontine>>(getRepositoryToken(Tontine));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tontine', async () => {
      const createTontineDto: CreateTontineDto = {
        title: 'Test Tontine',
        legacy: 'Test Legacy',
        currency: 'FCFA',
        members: [
          {
            username: 'testuser',
            firstname: 'Test',
            lastname: 'User',
            phone: '1234567890',
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

      const mockTontine = {
        id: 1,
        ...createTontineDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTontineRepository.create.mockReturnValue(mockTontine);
      mockTontineRepository.save.mockResolvedValue(mockTontine);

      const result = await service.create(createTontineDto);

      expect(tontineRepository.create).toHaveBeenCalledWith(createTontineDto);
      expect(tontineRepository.save).toHaveBeenCalledWith(mockTontine);
      expect(result).toEqual(mockTontine);
    });
  });

  describe('findOne', () => {
    it('should return a tontine by id', async () => {
      const tontineId = 1;
      const mockTontine = {
        id: tontineId,
        title: 'Test Tontine',
        legacy: 'Test Legacy',
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);

      const result = await service.findOne(tontineId);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(result).toEqual(mockTontine);
    });

    it('should throw NotFoundException if tontine not found', async () => {
      const tontineId = 999;

      mockTontineRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tontineId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tontine', async () => {
      const tontineId = 1;
      const updateTontineDto: UpdateTontineDto = {
        title: 'Updated Tontine',
        legacy: 'Updated Legacy',
      };

      const mockTontine = {
        id: tontineId,
        ...updateTontineDto,
        updatedAt: new Date(),
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);
      mockTontineRepository.save.mockResolvedValue(mockTontine);

      const result = await service.update(tontineId, updateTontineDto);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(tontineRepository.save).toHaveBeenCalledWith(mockTontine);
      expect(result).toEqual(mockTontine);
    });

    it('should throw NotFoundException if tontine not found', async () => {
      const tontineId = 999;
      const updateTontineDto: UpdateTontineDto = {
        title: 'Updated Tontine',
      };

      mockTontineRepository.findOne.mockResolvedValue(null);

      await expect(service.update(tontineId, updateTontineDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a tontine', async () => {
      const tontineId = 1;
      const mockTontine = {
        id: tontineId,
        title: 'Test Tontine',
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);
      mockTontineRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(tontineId);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(tontineRepository.delete).toHaveBeenCalledWith(tontineId);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if tontine not found', async () => {
      const tontineId = 999;

      mockTontineRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(tontineId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByMember', () => {
    it('should return tontines for a member', async () => {
      const username = 'testuser';
      const mockTontines = [
        { id: 1, title: 'Tontine 1', members: [{ username: 'testuser' }] },
        { id: 2, title: 'Tontine 2', members: [{ username: 'testuser' }] },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn().mockResolvedValue(mockTontines),
      };

      mockTontineRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByMember(username);

      expect(tontineRepository.createQueryBuilder).toHaveBeenCalledWith('tontine');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('tontine.members', 'member');
      expect(queryBuilder.where).toHaveBeenCalledWith('member.username = :username', { username });
      expect(result).toEqual(mockTontines);
    });
  });

  describe('setSelectedTontine', () => {
    it('should set selected tontine for user', async () => {
      const tontineId = 1;
      const username = 'testuser';

      const mockTontine = {
        id: tontineId,
        title: 'Test Tontine',
        selectedBy: [],
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);
      mockTontineRepository.save.mockResolvedValue({
        ...mockTontine,
        selectedBy: [username],
      });

      const result = await service.setSelectedTontine(tontineId, username);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(tontineRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('createDeposit', () => {
    it('should create a deposit', async () => {
      const tontineId = 1;
      const createDepositDto: CreateDepositDto = {
        amount: 100,
        currency: Currency.FCFA,
        memberId: 1,
        status: StatusDeposit.PENDING,
        cashFlowId: 1,
        reasons: 'Test deposit',
      };
      const status = StatusDeposit.PENDING;
      const user = { username: 'testuser', id: 1, password: 'password', roles: [] };

      const mockTontine = {
        id: tontineId,
        title: 'Test Tontine',
        deposits: [],
      };

      const mockDeposit = {
        id: 1,
        ...createDepositDto,
        status,
        user,
        tontine: mockTontine,
        createdAt: new Date(),
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);
      mockTontineRepository.save.mockResolvedValue({
        ...mockTontine,
        deposits: [mockDeposit],
      });

      const result = await service.createDeposit(tontineId, createDepositDto, status, user);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(tontineRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockDeposit);
    });

    it('should throw NotFoundException if tontine not found', async () => {
      const tontineId = 999;
      const createDepositDto: CreateDepositDto = {
        amount: 100,
        currency: Currency.FCFA,
        memberId: 1,
        status: StatusDeposit.PENDING,
        cashFlowId: 1,
        reasons: 'Test deposit',
      };
      const status = StatusDeposit.PENDING;
      const user = { username: 'testuser', id: 1, password: 'password', roles: [] };

      mockTontineRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createDeposit(tontineId, createDepositDto, status, user),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDeposits', () => {
    it('should return deposits for a tontine', async () => {
      const tontineId = 1;
      const mockTontine = {
        id: tontineId,
        title: 'Test Tontine',
        deposits: [
          { id: 1, amount: 100, status: StatusDeposit.APPROVED },
          { id: 2, amount: 200, status: StatusDeposit.PENDING },
        ],
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);

      const result = await service.getDeposits(tontineId);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(result).toEqual(mockTontine.deposits);
    });

    it('should throw NotFoundException if tontine not found', async () => {
      const tontineId = 999;

      mockTontineRepository.findOne.mockResolvedValue(null);

      await expect(service.getDeposits(tontineId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDeposit', () => {
    it('should update a deposit', async () => {
      const tontineId = 1;
      const depositId = 123;
      const updateDepositDto: CreateDepositDto = {
        amount: 150,
        currency: Currency.FCFA,
        memberId: 1,
        status: StatusDeposit.APPROVED,
        cashFlowId: 1,
        reasons: 'Updated deposit',
      };
      const user = { username: 'testuser', id: 1, password: 'password', roles: [] };

      const mockTontine = {
        id: tontineId,
        title: 'Test Tontine',
        deposits: [
          {
            id: depositId,
            amount: 100,
            reasons: 'Old deposit',
            user: { id: 1 },
          },
        ],
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);
      mockTontineRepository.save.mockResolvedValue({
        ...mockTontine,
        deposits: [
          {
            id: depositId,
            ...updateDepositDto,
            user: { id: 1 },
          },
        ],
      });

      const result = await service.updateDeposit(tontineId, depositId, updateDepositDto, user);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(tontineRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('removeDeposit', () => {
    it('should remove a deposit', async () => {
      const tontineId = 1;
      const depositId = 123;
      const user = { username: 'accountmanager', id: 1, password: 'password', roles: [Role.ACCOUNT_MANAGER] };

      const mockTontine = {
        id: tontineId,
        title: 'Test Tontine',
        deposits: [
          {
            id: depositId,
            amount: 100,
            reasons: 'Test deposit',
          },
        ],
      };

      mockTontineRepository.findOne.mockResolvedValue(mockTontine);
      mockTontineRepository.save.mockResolvedValue({
        ...mockTontine,
        deposits: [],
      });

      const result = await service.removeDeposit(tontineId, depositId, user);

      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: tontineId },
        relations: ['members', 'deposits', 'rapports', 'sanctions'],
      });
      expect(tontineRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
