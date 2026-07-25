import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { TypeSanction } from './tontine/enum/type-sanction';
import { StatusDeposit } from './tontine/enum/status-deposit';
import { Public } from './authentification/entities/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/param')
  getParam(): any {
    const typesSanctions = Object.keys(TypeSanction).map(
      (key) => TypeSanction[key],
    );

    const typesDeposits = Object.keys(StatusDeposit).map(
      (key) => StatusDeposit[key],
    );

    return {
      typesSanctions,
      typesDeposits,
    };
  }

  @Public()
  @Get('/health')
  health(): any {
    return {
      status: 'ok',
    };
  }
}
