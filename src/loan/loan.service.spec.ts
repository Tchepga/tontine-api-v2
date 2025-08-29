import { Test, TestingModule } from '@nestjs/testing';
import { LoanService } from './loan.service';
import { DataSource } from 'typeorm';
import { NotificationService } from '../notification/notification.service';

describe('LoanService', () => {
  let service: LoanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => ({
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              delete: jest.fn(),
            })),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
