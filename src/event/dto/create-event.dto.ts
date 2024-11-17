import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { EventType } from '../enum/event-type';

export class CreateEventDto {
  @IsNumber()
  tontineId: number;

  @IsString()
  title: string;

  @IsEnum(EventType, { message: 'Invalid type' })
  type: EventType;

  @IsString()
  description: string;

  @IsDate()
  startDate?: Date;

  @IsDate()
  endDate?: Date;

  participants?: number[];
}
