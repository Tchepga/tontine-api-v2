import { Test, TestingModule } from '@nestjs/testing';
import { TontineController } from './tontine.controller';
import { TontineService } from './tontine.service';
import { AuthentificationService } from '../authentification/authentification.service';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateMemberDto } from '../member/dto/create-member.dto';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../authentification/entities/roles/roles.enum';
import { StatusDeposit } from './enum/status-deposit';

describe('TontineController', () => {
  let controller: TontineController;
  let tontineService: TontineService;
  let authService: AuthentificationService;

  const mockTontineService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByMember: jest.fn(),
    setSelectedTontine: jest.fn(),
    updateConfig: jest.fn(),
    getPartOrder: jest.fn(),
    createPartOrder: jest.fn(),
    updatePartOrder: jest.fn(),
    deletePartOrder: jest.fn(),
    addMember: jest.fn(),
    addMemberFromScratch: jest.fn(),
    removeMember: jest.fn(),
    getRapports: jest.fn(),
    createRapport: jest.fn(),
    updateRapport: jest.fn(),
    removeRapport: jest.fn(),
    getRapport: jest.fn(),
    createSanction: jest.fn(),
    updateSanction: jest.fn(),
    removeSanction: jest.fn(),
    getDeposits: jest.fn(),
    createDeposit: jest.fn(),
    updateDeposit: jest.fn(),
    removeDeposit: jest.fn(),
  };

  const mockAuthService = {
    findByUsername: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TontineController],
      providers: [
        {
          provide: TontineService,
          useValue: mockTontineService,
        },
        {
          provide: AuthentificationService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<TontineController>(TontineController);
    tontineService = module.get<TontineService>(TontineService);
    authService = module.get<AuthentificationService>(AuthentificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tontine', async () => {
      const createTontineDto: CreateTontineDto = {
        name: 'Test Tontine',
        description: 'Test Description',
        amount: 1000,
        frequency: 'monthly',
      };

      const expectedResult = {
        id: 1,
        ...createTontineDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTontineService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTontineDto);

      expect(tontineService.create).toHaveBeenCalledWith(createTontineDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a tontine if user is member', async () => {
      const tontineId = '1';
      const mockUser = {
        username: 'testuser',
        role: [Role.TONTINARD],
      };

      const mockTontine = {
        id: 1,
        name: 'Test Tontine',
        members: [{ username: 'testuser' }],
      };

      const mockRequest = {
        user: mockUser,
      };

      mockAuthService.findByUsername.mockResolvedValue(mockUser);
      mockTontineService.findOne.mockResolvedValue(mockTontine);

      const result = await controller.findOne(tontineId, mockRequest);

      expect(authService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(tontineService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTontine);
    });

    it('should throw NotFoundException if user is not member', async () => {
      const tontineId = '1';
      const mockUser = {
        username: 'testuser',
        role: [Role.TONTINARD],
      };

      const mockTontine = {
        id: 1,
        name: 'Test Tontine',
        members: [{ username: 'otheruser' }],
      };

      const mockRequest = {
        user: mockUser,
      };

      mockAuthService.findByUsername.mockResolvedValue(mockUser);
      mockTontineService.findOne.mockResolvedValue(mockTontine);

      await expect(controller.findOne(tontineId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setSelectedTontine', () => {
    it('should set selected tontine for user', async () => {
      const tontineId = '1';
      const mockUser = {
        username: 'testuser',
        role: [Role.TONTINARD],
      };

      const mockRequest = {
        user: mockUser,
      };

      const expectedResult = { success: true };

      mockTontineService.setSelectedTontine.mockResolvedValue(expectedResult);

      const result = await controller.setSelectedTontine(
        tontineId,
        mockRequest,
      );

      expect(tontineService.setSelectedTontine).toHaveBeenCalledWith(
        1,
        'testuser',
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByMember', () => {
    it('should return tontines for a member', async () => {
      const username = 'testuser';
      const expectedTontines = [
        { id: 1, name: 'Tontine 1' },
        { id: 2, name: 'Tontine 2' },
      ];

      mockTontineService.findByMember.mockResolvedValue(expectedTontines);

      const result = await controller.findByMember(username);

      expect(tontineService.findByMember).toHaveBeenCalledWith(username);
      expect(result).toEqual(expectedTontines);
    });

    it('should throw NotFoundException if no tontines found', async () => {
      const username = 'testuser';

      mockTontineService.findByMember.mockResolvedValue([]);

      await expect(controller.findByMember(username)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a tontine', async () => {
      const tontineId = '1';
      const updateTontineDto: UpdateTontineDto = {
        name: 'Updated Tontine',
        description: 'Updated Description',
      };

      const expectedResult = {
        id: 1,
        ...updateTontineDto,
        updatedAt: new Date(),
      };

      mockTontineService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(tontineId, updateTontineDto);

      expect(tontineService.update).toHaveBeenCalledWith(1, updateTontineDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('addMember', () => {
    it('should add a member to tontine', async () => {
      const tontineId = '1';
      const memberData = { memberId: 123 };

      const expectedResult = { success: true };

      mockTontineService.addMember.mockResolvedValue(expectedResult);

      const result = await controller.addMember(tontineId, memberData);

      expect(tontineService.addMember).toHaveBeenCalledWith(1, 123);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('addMemberFromScratch', () => {
    it('should add a new member from scratch', async () => {
      const tontineId = '1';
      const createMemberDto: CreateMemberDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      const expectedResult = {
        id: 1,
        ...createMemberDto,
        createdAt: new Date(),
      };

      mockTontineService.addMemberFromScratch.mockResolvedValue(expectedResult);

      const result = await controller.addMemberFromScratch(
        tontineId,
        createMemberDto,
      );

      expect(tontineService.addMemberFromScratch).toHaveBeenCalledWith(
        1,
        createMemberDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from tontine', async () => {
      const tontineId = '1';
      const memberId = '123';

      const expectedResult = { success: true };

      mockTontineService.removeMember.mockResolvedValue(expectedResult);

      const result = await controller.removeMember(tontineId, memberId);

      expect(tontineService.removeMember).toHaveBeenCalledWith(1, 123);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a tontine', async () => {
      const tontineId = '1';

      const expectedResult = { success: true };

      mockTontineService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(tontineId);

      expect(tontineService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createDeposit', () => {
    it('should create a deposit with PENDING status for regular user', async () => {
      const tontineId = '1';
      const createDepositDto: CreateDepositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      const mockUser = {
        username: 'testuser',
        role: [Role.TONTINARD],
      };

      const mockRequest = {
        user: mockUser,
      };

      const expectedResult = {
        id: 1,
        ...createDepositDto,
        status: StatusDeposit.PENDING,
        createdAt: new Date(),
      };

      mockTontineService.createDeposit.mockResolvedValue(expectedResult);

      const result = await controller.createDeposit(
        tontineId,
        createDepositDto,
        mockRequest,
      );

      expect(tontineService.createDeposit).toHaveBeenCalledWith(
        1,
        createDepositDto,
        StatusDeposit.PENDING,
        mockUser,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should create a deposit with APPROVED status for president', async () => {
      const tontineId = '1';
      const createDepositDto: CreateDepositDto = {
        amount: 100,
        description: 'Test deposit',
      };

      const mockUser = {
        username: 'president',
        role: [Role.PRESIDENT],
      };

      const mockRequest = {
        user: mockUser,
      };

      const expectedResult = {
        id: 1,
        ...createDepositDto,
        status: StatusDeposit.APPROVED,
        createdAt: new Date(),
      };

      mockTontineService.createDeposit.mockResolvedValue(expectedResult);

      const result = await controller.createDeposit(
        tontineId,
        createDepositDto,
        mockRequest,
      );

      expect(tontineService.createDeposit).toHaveBeenCalledWith(
        1,
        createDepositDto,
        StatusDeposit.APPROVED,
        mockUser,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getDeposit', () => {
    it('should return deposits for a tontine', async () => {
      const tontineId = '1';
      const expectedDeposits = [
        { id: 1, amount: 100, status: StatusDeposit.APPROVED },
        { id: 2, amount: 200, status: StatusDeposit.PENDING },
      ];

      mockTontineService.getDeposits.mockResolvedValue(expectedDeposits);

      const result = await controller.getDeposit(tontineId);

      expect(tontineService.getDeposits).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedDeposits);
    });
  });

  describe('updateDeposit', () => {
    it('should update a deposit', async () => {
      const tontineId = '1';
      const depositId = '123';
      const updateDepositDto: CreateDepositDto = {
        amount: 150,
        description: 'Updated deposit',
      };

      const mockUser = {
        username: 'testuser',
        role: [Role.TONTINARD],
      };

      const mockRequest = {
        user: mockUser,
      };

      const expectedResult = {
        id: 123,
        ...updateDepositDto,
        updatedAt: new Date(),
      };

      mockTontineService.updateDeposit.mockResolvedValue(expectedResult);

      const result = await controller.updateDeposit(
        tontineId,
        depositId,
        updateDepositDto,
        mockRequest,
      );

      expect(tontineService.updateDeposit).toHaveBeenCalledWith(
        1,
        123,
        updateDepositDto,
        mockUser,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteDeposit', () => {
    it('should delete a deposit', async () => {
      const tontineId = '1';
      const depositId = '123';

      const mockUser = {
        username: 'accountmanager',
        role: [Role.ACCOUNT_MANAGER],
      };

      const mockRequest = {
        user: mockUser,
      };

      const expectedResult = { success: true };

      mockTontineService.removeDeposit.mockResolvedValue(expectedResult);

      const result = await controller.deleteDeposit(
        tontineId,
        depositId,
        mockRequest,
      );

      expect(tontineService.removeDeposit).toHaveBeenCalledWith(
        1,
        123,
        mockUser,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
