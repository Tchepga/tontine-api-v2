import { Type } from 'class-transformer';
import { IsDate, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSanctionDto {
  @IsString()
  type: string;

  @IsString()
  description: string;

  @IsNumber()
  memberId: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
