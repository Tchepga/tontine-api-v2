import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/authentification/roles.guard';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { Tontine } from './entities/tontine.entity';
import { TontineService } from './tontine.service';

@Controller('tontine')
@Roles(['admin'])
export class TontineController {
  constructor(private readonly tontineService: TontineService) {}

  @Post()
  create(@Body() createTontineDto: CreateTontineDto) {
    return this.tontineService.create(createTontineDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tontineService.findOne(+id);
  }
  @Get('member/:username')
  findByMember(@Param('username') username: string): Promise<Tontine[]> {
    return this.tontineService.findByMember(username);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTontineDto: UpdateTontineDto) {
    return this.tontineService.update(+id, updateTontineDto);
  }

  @Patch(':id/member')
  addMember(@Param('id') id: string, @Body() username: string) {
    return this.tontineService.addMember(+id, username);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tontineService.remove(+id);
  }
}
