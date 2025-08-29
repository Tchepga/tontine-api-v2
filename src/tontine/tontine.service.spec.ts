import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TontineService } from './tontine.service';
import { Tontine } from './entities/tontine.entity';
import { Repository } from 'typeorm';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { SystemType } from './enum/system-type';
import { mockProviders } from '../testing.helpers';

describe('TontineService', () => {
  let service: TontineService;
  let tontineRepository: Repository<Tontine>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TontineService, ...mockProviders],
    }).compile();

    service = module.get<TontineService>(TontineService);
    tontineRepository = module.get<Repository<Tontine>>(
      getRepositoryToken(Tontine),
    );
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

      jest
        .spyOn(tontineRepository, 'create')
        .mockReturnValue(mockTontine as any);
      jest
        .spyOn(tontineRepository, 'save')
        .mockResolvedValue(mockTontine as any);

      const result = await service.create(createTontineDto);

      expect(tontineRepository.create).toHaveBeenCalledWith(createTontineDto);
      expect(tontineRepository.save).toHaveBeenCalledWith(mockTontine);
      expect(result).toEqual(mockTontine);
    });
  });
});
