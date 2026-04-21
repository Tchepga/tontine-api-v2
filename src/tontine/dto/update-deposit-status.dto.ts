import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusDeposit } from '../enum/status-deposit';

export class UpdateDepositStatusDto {
  @ApiProperty({
    description: 'Nouveau statut du dépôt',
    enum: StatusDeposit,
    example: StatusDeposit.APPROVED,
  })
  @IsEnum(StatusDeposit, {
    message: 'Le statut doit être PENDING, APPROVED ou REJECTED',
  })
  status: StatusDeposit;

  @ApiProperty({
    description: 'Raison du changement de statut (optionnel)',
    example: 'Dépôt validé après vérification des documents',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
