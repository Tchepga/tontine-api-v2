import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLoanRepaymentDto {
  @ApiProperty({
    description: 'Montant total du remboursement',
    example: 52500,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Part du capital remboursé',
    example: 50000,
  })
  @IsNumber()
  @Min(0)
  principalAmount: number;

  @ApiProperty({
    description: "Part des intérêts (sera créditée aux dividendes)",
    example: 2500,
  })
  @IsNumber()
  @Min(0)
  interestAmount: number;

  @ApiProperty({ description: 'Devise', example: 'FCFA', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Remarques', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
