import { PartialType } from '@nestjs/mapped-types';
import { CreateTontineDto } from './create-tontine.dto';

export class UpdateTontineDto extends PartialType(CreateTontineDto) {}
