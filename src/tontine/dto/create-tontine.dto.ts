import {
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { CreateMemberDto } from 'src/member/dto/create-member.dto';
import { ConfigTontine } from '../entities/config-tontine.entity';
import { Type } from 'class-transformer';
import { SystemType } from '../enum/system-type';

export class CreateConfigTontineDto {
  @IsNumber()
  defaultLoanRate: number | undefined;

  @IsNumber()
  defaultLoanDuration: number | undefined;

  @IsString()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY'], {
    message:
      "La période de boucle doit être l'une des suivantes : DAILY, WEEKLY, ou MONTHLY",
  })
  loopPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  minLoanAmount: number | undefined;

  @IsNumber()
  countPersonPerMovement: number | undefined;

  @IsString()
  movementType: 'ROTATIVE' | 'CUMULATIVE' | undefined;

  rateMaps: RateMapDto[] | undefined;

  @IsNumber()
  countMaxMember: number | undefined;

  @IsEnum(SystemType)
  systemType: SystemType;

}

export class RateMapDto {
  @IsNumber()
  rate: number;

  @IsNumber()
  maxAmount: number;

  @IsNumber()
  minAmount: number;
}

export class CreateTontineDto {
  @IsString({ message: 'Le titre de la tontine est requis' })
  title: string;

  legacy: string;

  @IsNotEmpty({ message: 'Un membre au minimum lors de la creation' })
  members: CreateMemberDto[];

  @IsNotEmptyObject({ nullable: false })
  config: CreateConfigTontineDto;

  @IsString()
  @IsIn(['FCFA', 'USD', 'EUR'], {
    message: "La devise doit être l'une des suivantes : FCFA, USD, ou EUR",
  })
  currency: 'FCFA' | 'USD' | 'EUR';
}

export function createToConfigTontineDtoToConfigTontine(
  createConfigTontineDto: CreateConfigTontineDto
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

export class PartOrderDto {
  @IsNumber()
  memberId: number;

  @IsNumber()
  order: number;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  period: Date;
}
