import { IsIn, IsNumber, IsString } from 'class-validator';
import { CreateMemberDto } from 'src/member/dto/create-member.dto';

export class CreateTontineDto {
  @IsString({ message: 'Le titre de la tontine est requis' })
  title: string;

  legacy: string;

  members: CreateMemberDto[];

  config: CreateConfigTontineDto;
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

  @IsString()
  minLoanAmount: number;

  @IsString()
  countPersonPerMovement: number;

  @IsString()
  movementType: 'ROTATIVE' | 'CUMULATIVE';
}
