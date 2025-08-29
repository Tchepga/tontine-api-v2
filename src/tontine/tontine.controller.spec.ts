import { Test, TestingModule } from '@nestjs/testing';
import { TontineController } from './tontine.controller';
import { TontineService } from './tontine.service';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateMemberDto } from '../member/dto/create-member.dto';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../authentification/entities/roles/roles.enum';
import { StatusDeposit } from './enum/status-deposit';
import { Currency } from './enum/shared';
import { SystemType } from './enum/system-type';
import { mockProviders } from '../testing.helpers';

describe('TontineController', () => {
  let controller: TontineController;
  let tontineService: TontineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TontineController],
      providers: [TontineService, ...mockProviders],
    }).compile();

    controller = module.get<TontineController>(TontineController);
    tontineService = module.get<TontineService>(TontineService);
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

      const expectedResult = {
        id: 1,
        ...createTontineDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(tontineService, 'create').mockResolvedValue(expectedResult as any);

      const result = await controller.create(createTontineDto);

      expect(tontineService.create).toHaveBeenCalledWith(createTontineDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
