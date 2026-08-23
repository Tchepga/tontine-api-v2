import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class RestartTontineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  carryOverCash?: boolean = true;
}
