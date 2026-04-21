import { Test, TestingModule } from '@nestjs/testing';
import { AuthentificationService } from './authentification.service';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('AuthentificationService', () => {
  let service: AuthentificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthentificationService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => ({
              findOne: jest.fn(),
              save: jest.fn(),
            })),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthentificationService>(AuthentificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
