import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { TontineService } from './tontine.service';

@Controller('tontine')
export class TontineController {
  constructor(private readonly tontineService: TontineService) {}

  @Post()
  create(@Body() createTontineDto: CreateTontineDto) {
    return this.tontineService.create(createTontineDto);
  }

  @Get()
  findAll() {
    return this.tontineService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tontineService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTontineDto: UpdateTontineDto) {
    return this.tontineService.update(+id, updateTontineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tontineService.remove(+id);
  }
}
