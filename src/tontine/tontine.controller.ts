import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { CreateMeetingRapportDto } from './dto/create-meeting-rapport.dto';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { Tontine } from './entities/tontine.entity';
import { TontineService } from './tontine.service';
import { isMemberOfTontine } from './utilities/service.helper';

@UseGuards(RolesGuard)
@Controller('tontine')
export class TontineController {
  constructor(
    private readonly tontineService: TontineService,
    private readonly userService: AuthentificationService,
  ) {}

  @Post()
  create(@Body() createTontineDto: CreateTontineDto) {
    return this.tontineService.create(createTontineDto);
  }

  @Get(':id')
  @Roles(Role.TONTINARD)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = await this.userService.findByUsername(req?.user?.username);
    const tontine = await this.tontineService.findOne(+id);

    const isMember = isMemberOfTontine(tontine, user?.username);
    if (!isMember) {
      throw new NotFoundException(`Tontine not found`);
    }

    return tontine;
  }

  @Get('member/:username')
  @Roles(Role.TONTINARD)
  async findByMember(@Param('username') username: string): Promise<Tontine[]> {
    const tontines = await this.tontineService.findByMember(username);
    const ownTontines = tontines.filter((tontine) =>
      isMemberOfTontine(tontine, username),
    );
    if (ownTontines.length === 0) {
      throw new NotFoundException(`Tontine not found`);
    }

    return ownTontines;
  }

  @Patch(':id')
  @Roles(Role.TONTINARD)
  update(@Param('id') id: string, @Body() updateTontineDto: UpdateTontineDto) {
    return this.tontineService.update(+id, updateTontineDto);
  }

  @Patch(':id/member')
  @Roles(Role.PRESIDENT)
  addMember(@Param('id') id: string, @Body() data: { memberId: number }) {
    return this.tontineService.addMember(+id, data.memberId);
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
    return this.tontineService.createRapport(+id, user.username, rapport);
  }

  @Patch(':id/rapport')
  @Roles(Role.ACCOUNT_MANAGER)
  updateRapport(
    @Param('id') id: string,
    @Body() rapport: CreateMeetingRapportDto,
  ) {
    return this.tontineService.updateRapport(+id, rapport);
  }

  @Delete(':id/rapport')
  @Roles(Role.ACCOUNT_MANAGER)
  deleteRapport(@Param('id') id: string) {
    return this.tontineService.removeRapport(+id);
  }
}
