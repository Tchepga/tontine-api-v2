import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { TypeSanction } from './tontine/enum/type-sanction';
import { StatusDeposit } from './tontine/enum/status-deposit';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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

  @Get('/health')
  health(): any {
    return {
      status: 'ok',
    };
  }
}
