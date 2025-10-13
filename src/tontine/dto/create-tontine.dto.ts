import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsString,
} from 'class-validator';
import { CreateMemberDto } from '../../member/dto/create-member.dto';
import { ConfigTontine } from '../entities/config-tontine.entity';
import { SystemType } from '../enum/system-type';

export class RateMapDto {
  @ApiProperty({
    description: "Taux d'intérêt",
    example: 3.5,
  })
  @IsNumber()
  rate: number;

  @ApiProperty({
    description: 'Montant maximum',
    example: 100000,
  })
  @IsNumber()
  maxAmount: number;

  @ApiProperty({
    description: 'Montant minimum',
    example: 10000,
  })
  @IsNumber()
  minAmount: number;
}

export class CreateConfigTontineDto {
  @ApiProperty({
    description: 'Taux de prêt par défaut',
    example: 5.5,
    required: false,
  })
  @IsNumber()
  defaultLoanRate: number | undefined;

  @ApiProperty({
    description: 'Durée de prêt par défaut en jours',
    example: 30,
    required: false,
  })
  @IsNumber()
  defaultLoanDuration: number | undefined;

  @ApiProperty({
    description: 'Période de boucle de la tontine',
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
    example: 'MONTHLY',
  })
  @IsString()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY'], {
    message:
      "La période de boucle doit être l'une des suivantes : DAILY, WEEKLY, ou MONTHLY",
  })
  loopPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @ApiProperty({
    description: 'Montant minimum de prêt',
    example: 10000,
    required: false,
  })
  minLoanAmount: number | undefined;

  @ApiProperty({
    description: 'Nombre de personnes par mouvement',
    example: 1,
    required: false,
  })
  @IsNumber()
  countPersonPerMovement: number | undefined;

  @ApiProperty({
    description: 'Type de mouvement',
    enum: ['ROTATIVE', 'CUMULATIVE'],
    example: 'ROTATIVE',
    required: false,
  })
  @IsString()
  movementType: 'ROTATIVE' | 'CUMULATIVE' | undefined;

  @ApiProperty({
    description: 'Cartes de taux',
    type: [RateMapDto],
    required: false,
  })
  rateMaps: RateMapDto[] | undefined;

  @ApiProperty({
    description: 'Nombre maximum de membres',
    example: 20,
    required: false,
  })
  @IsNumber()
  countMaxMember: number | undefined;

  @ApiProperty({
    description: 'Type de système de tontine',
    enum: SystemType,
    example: SystemType.PART,
  })
  @IsEnum(SystemType)
  systemType: SystemType;
}

export class CreateTontineDto {
  @ApiProperty({
    description: 'Titre de la tontine',
    example: 'Tontine des Amis',
  })
  @IsString({ message: 'Le titre de la tontine est requis' })
  title: string;

  @ApiProperty({
    description: 'Héritage ou description de la tontine',
    example: 'Tontine créée pour les amis',
    required: false,
  })
  legacy: string;

  @ApiProperty({
    description: 'Liste des membres de la tontine',
    type: [CreateMemberDto],
    example: [
      { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
    ],
  })
  @IsNotEmpty({ message: 'Un membre au minimum lors de la creation' })
  members: CreateMemberDto[];

  @ApiProperty({
    description: 'Configuration de la tontine',
    type: CreateConfigTontineDto,
  })
  @IsNotEmptyObject({ nullable: false })
  config: CreateConfigTontineDto;

  @ApiProperty({
    description: 'Devise utilisée dans la tontine',
    enum: ['FCFA', 'USD', 'EUR'],
    example: 'FCFA',
  })
  @IsString()
  @IsIn(['FCFA', 'USD', 'EUR'], {
    message: "La devise doit être l'une des suivantes : FCFA, USD, ou EUR",
  })
  currency: 'FCFA' | 'USD' | 'EUR';
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

export class PartOrderDto {
  @ApiProperty({
    description: 'ID du membre',
    example: 1,
  })
  @IsNumber({}, { message: 'Le membre est requis' })
  memberId: number;

  @ApiProperty({
    description: 'Ordre de participation',
    example: 1,
  })
  @IsNumber({}, { message: "L'ordre est requis" })
  order: number;

  @ApiProperty({
    description: 'Période de participation',
    example: '2024-06-23',
  })
  @IsDateString({}, { message: "La période est requise (ex: '2024-06-23')" })
  period: Date;
}
