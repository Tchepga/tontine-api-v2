import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
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

  @IsDateString()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  participants?: number[];
}
