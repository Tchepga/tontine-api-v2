import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Action } from '../utility/message-notification';

export class CreateNotificationDto {
  @IsOptional()
  @IsNumber()
  eventId?: number;

  @IsOptional()
  @IsNumber()
  tontineId: number;

  @IsOptional()
  @IsNumber()
  memberId?: number;

  @IsOptional()
  @IsNumber()
  depositId?: number;

  @IsOptional()
  @IsNumber()
  loanId?: number;

  @IsOptional()
  @IsNumber()
  sanctionId?: number;

  @IsEnum(Action)
  action: Action;

  @IsString()
  type: string;
}
