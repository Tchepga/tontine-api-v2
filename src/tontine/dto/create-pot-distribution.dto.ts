import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePotDistributionDto {
  @ApiProperty({ description: 'ID du membre bénéficiaire', example: 3 })
  @IsNumber()
  recipientId: number;

  @ApiProperty({ description: 'Montant distribué', example: 120000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Devise', example: 'FCFA', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Période / cycle (YYYY-MM-DD)',
    example: '2024-03-01',
  })
  @IsDateString()
  period: string;

  @ApiProperty({ description: 'Remarques', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
