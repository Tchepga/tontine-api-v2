import { Test, TestingModule } from '@nestjs/testing';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { TontineController } from './tontine.controller';
import { TontineService } from './tontine.service';

describe('TontineController', () => {
  let controller: TontineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TontineController],
      providers: [
        {
          provide: TontineService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findByMember: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuthentificationService,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TontineController>(TontineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
