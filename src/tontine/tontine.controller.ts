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
import {
  CreateConfigTontineDto,
  CreateTontineDto,
} from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { Tontine } from './entities/tontine.entity';
import { TontineService } from './tontine.service';
import { isMemberOfTontine } from './utilities/service.helper';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { StatusDeposit } from './enum/status-deposit';

@UseGuards(RolesGuard)
@Controller('tontine')
export class TontineController {
  constructor(
    private readonly tontineService: TontineService,
    private readonly userService: AuthentificationService,
  ) { }

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

  @Patch(':id/select-tontine')
  @Roles(Role.TONTINARD)
  setSelectedTontine(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.tontineService.setSelectedTontine(+id, user.username);
  }

  @Get('member/:username')
  @Roles(Role.TONTINARD)
  async findByMember(@Param('username') username: string): Promise<Tontine[]> {
    const tontines = await this.tontineService.findByMember(username);

    if (tontines.length === 0) {
      throw new NotFoundException(`Tontine not found`);
    }

    return tontines;
  }

  @Patch(':id')
  @Roles(Role.TONTINARD)
  update(@Param('id') id: string, @Body() updateTontineDto: UpdateTontineDto) {
    return this.tontineService.update(+id, updateTontineDto);
  }

  @Patch(':id/config')
  @Roles(Role.PRESIDENT)
  updateConfig(
    @Param('id') id: string,
    @Body() updateConfigDto: CreateConfigTontineDto,
  ) {
    return this.tontineService.updateConfig(+id, updateConfigDto);
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

  @Post(':id/sanction')
  @Roles(Role.OFFICE_MANAGER)
  createSanction(@Param('id') id: string, @Body() sanction: CreateSanctionDto) {
    return this.tontineService.createSanction(+id, sanction);
  }

  @Patch(':id/sanction/:sanctionId')
  @Roles(Role.OFFICE_MANAGER)
  updateSanction(
    @Param('id') id: string,
    @Param('sanctionId') sanctionId: string,
    @Body() sanction: any,
  ) {
    return this.tontineService.updateSanction(+id, +sanctionId, sanction);
  }

  @Delete(':id/sanction')
  @Roles(Role.OFFICE_MANAGER)
  deleteSanction(
    @Param('id') id: string,
    @Param('sanctionId') sanctionId: string,
  ) {
    return this.tontineService.removeSanction(+id, +sanctionId);
  }

  // Deposist part
  @Get(':id/deposit')
  @Roles(Role.TONTINARD)
  getDeposit(@Param('id') id: string) {
    return this.tontineService.getDeposits(+id);
  }

  @Post(':id/deposit')
  @Roles(Role.TONTINARD)
  createDeposit(
    @Param('id') id: string,
    @Body() createDepositDto: CreateDepositDto,
    @Req() req: any,
  ) {
    const user = req.user;
    let status: StatusDeposit = StatusDeposit.PENDING;
    if (
      user.role.find(
        (role) => role === Role.PRESIDENT || role === Role.ACCOUNT_MANAGER,
      )
    ) {
      status = StatusDeposit.APPROVED;
    }
    return this.tontineService.createDeposit(+id, createDepositDto, status);
  }

  @Patch(':id/deposit/:depositId')
  @Roles(Role.TONTINARD)
  updateDeposit(
    @Param('id') id: string,
    @Param('depositId') depositId: string,
    @Body() createDepositDto: CreateDepositDto,
  ) {
    return this.tontineService.updateDeposit(+id, +depositId, createDepositDto);
  }

  @Delete(':id/deposit/:depositId')
  @Roles(Role.ACCOUNT_MANAGER)
  deleteDeposit(
    @Param('id') id: string,
    @Param('depositId') depositId: string,
  ) {
    return this.tontineService.removeDeposit(+id, +depositId);
  }
}
