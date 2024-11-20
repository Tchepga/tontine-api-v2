import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { Tontine } from './entities/tontine.entity';
import { TontineService } from './tontine.service';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { CreateMeetingRapportDto } from './dto/create-meeting-rapport.dto';

@UseGuards(RolesGuard)
@Controller('tontine')
export class TontineController {
  constructor(private readonly tontineService: TontineService) {}

  @Post()
  create(@Body() createTontineDto: CreateTontineDto) {
    return this.tontineService.create(createTontineDto);
  }

  @Get(':id')
  @Roles(Role.TONTINARD)
  findOne(@Param('id') id: string) {
    return this.tontineService.findOne(+id);
  }
  @Get('member/:username')
  @Roles(Role.TONTINARD)
  findByMember(@Param('username') username: string): Promise<Tontine[]> {
    return this.tontineService.findByMember(username);
  }

  @Patch(':id')
  @Roles(Role.PRESIDENT)
  update(@Param('id') id: string, @Body() updateTontineDto: UpdateTontineDto) {
    return this.tontineService.update(+id, updateTontineDto);
  }

  @Patch(':id/member')
  @Roles(Role.PRESIDENT)
  addMember(@Param('id') id: string, @Body() username: string) {
    return this.tontineService.addMember(+id, username);
  }

  @Delete(':id')
  @Roles(Role.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.tontineService.remove(+id);
  }

  @Post(':id/rapport')
  @Roles(Role.ACCOUNT_MANAGER)
  createRapport(
    @Req() req: any,
    @Param('id') id: string,
    @Body() rapport: CreateMeetingRapportDto,
  ) {
    const user = req.user;
    // return this.tontineService.createRapport(+id, rapport);
    console.log(user);
    return 'rapport created';
  }
}
