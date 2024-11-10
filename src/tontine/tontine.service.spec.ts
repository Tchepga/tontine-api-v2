import { Test, TestingModule } from '@nestjs/testing';
import { TontineService } from './tontine.service';

describe('TontineService', () => {
  let service: TontineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TontineService],
    }).compile();

    service = module.get<TontineService>(TontineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
