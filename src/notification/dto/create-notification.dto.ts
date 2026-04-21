import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TypeNotification } from '../enum/type-notification';
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

  @IsEnum(TypeNotification)
  type: TypeNotification;
}
