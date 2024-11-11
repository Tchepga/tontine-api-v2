import { IsIn, IsNumber, IsString } from 'class-validator';
import { CreateMemberDto } from 'src/member/dto/create-member.dto';
import { ConfigTontine } from '../entities/config-tontine.entity';

export class CreateTontineDto {
  @IsString({ message: 'Le titre de la tontine est requis' })
  title: string;

  legacy: string;

  members: CreateMemberDto[];

  config: CreateConfigTontineDto;

  @IsString()
  @IsIn(['FCFA', 'USD', 'EUR'], {
    message: "La devise doit être l'une des suivantes : FCFA, USD, ou EUR",
  })
  currency: 'FCFA' | 'USD' | 'EUR';
}

export class CreateConfigTontineDto {
  @IsNumber()
  defaultLoanRate: number;

  @IsNumber()
  defaultLoanDuration: number;

  @IsString()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY'], {
    message:
      "La période de boucle doit être l'une des suivantes : DAILY, WEEKLY, ou MONTHLY",
  })
  loopPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  minLoanAmount: number;

  @IsString()
  countPersonPerMovement: number;

  @IsString()
  movementType: 'ROTATIVE' | 'CUMULATIVE';
}

export function createToConfigTontineDtoToConfigTontine(
  createConfigTontineDto: CreateConfigTontineDto,
) {
  const {
    defaultLoanRate,
    defaultLoanDuration,
    loopPeriod,
    minLoanAmount,
    countPersonPerMovement,
    movementType,
  } = createConfigTontineDto;
  const configTontine = new ConfigTontine();
  configTontine.defaultLoanRate = defaultLoanRate;
  configTontine.defaultLoanDuration = defaultLoanDuration;
  configTontine.loopPeriod = loopPeriod;
  configTontine.minLoanAmount = minLoanAmount;
  configTontine.countPersonPerMovement = countPersonPerMovement;
  configTontine.movementType = movementType;
  return configTontine;
}
