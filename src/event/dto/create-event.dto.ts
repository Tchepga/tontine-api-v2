import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '../enum/event-type';

export class CreateEventDto {
  @ApiProperty({
    description: 'ID de la tontine',
    example: 1,
  })
  @IsNumber()
  tontineId: number;

  @ApiProperty({
    description: "Titre de l'événement",
    example: 'Réunion mensuelle',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Type d'événement",
    enum: EventType,
    example: EventType.MEETING,
  })
  @IsEnum(EventType, { message: 'Invalid type' })
  type: EventType;

  @ApiProperty({
    description: "Description de l'événement",
    example: 'Réunion mensuelle pour discuter des affaires de la tontine',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: "Date de début de l'événement",
    example: '2024-06-15T10:00:00Z',
    required: false,
  })
  @IsDateString()
  startDate?: Date;

  @ApiProperty({
    description: "Date de fin de l'événement",
    example: '2024-06-15T12:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    description: 'Liste des IDs des participants',
    type: [Number],
    example: [1, 2, 3],
    required: false,
  })
  participants?: number[];
}
