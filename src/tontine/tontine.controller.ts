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
import * as fs from 'fs';
import { AuthentificationService } from '../authentification/authentification.service';
import { Roles } from '../authentification/entities/roles/roles.decorator';
import { Role } from '../authentification/entities/roles/roles.enum';
import { RolesGuard } from '../authentification/entities/roles/roles.guard';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateMeetingRapportDto } from './dto/create-meeting-rapport.dto';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import {
  CreateConfigTontineDto,
  CreateTontineDto,
  PartOrderDto,
} from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { Tontine } from './entities/tontine.entity';
import { StatusDeposit } from './enum/status-deposit';
import { TontineService } from './tontine.service';
import { isMemberOfTontine } from './utilities/service.helper';
import { CreateMemberDto } from '../member/dto/create-member.dto';
import { LoggerService } from '../shared/services/logger.service';

@UseGuards(RolesGuard)
@Controller('tontine')
export class TontineController {
  private relativePathUploadFiles = 'upload/rapports/';
  private readonly logger = LoggerService.create('TontineController');

  constructor(
    private readonly tontineService: TontineService,
    private readonly userService: AuthentificationService,
  ) {}

  @Post()
  async create(@Body() createTontineDto: CreateTontineDto, @Req() req: any) {
    this.logger.log(
      `Creating new tontine: ${createTontineDto.title || 'Untitled'}`,
      'TontineController',
    );

    try {
      const result = await this.tontineService.create(createTontineDto);
      this.logger.logUserActivity(
        req?.user?.username || 'anonymous',
        'CREATE_TONTINE',
        { tontineId: result.id, tontineName: createTontineDto.title },
      );
      return result;
    } catch (error) {
      this.logger.logException(error, 'TontineController');
      throw error;
    }
  }

  @Get(':id')
  @Roles(Role.TONTINARD)
  async findOne(@Param('id') id: string, @Req() req: any) {
    this.logger.log(`Fetching tontine with ID: ${id}`, 'TontineController');

    try {
      const user = await this.userService.findByUsername(req?.user?.username);
      const tontine = await this.tontineService.findOne(+id);

      const isMember = isMemberOfTontine(tontine, user?.username);
      if (!isMember) {
        this.logger.warn(
          `User ${user?.username} attempted to access tontine ${id} without permission`,
          'TontineController',
        );
        throw new NotFoundException(`Tontine not found`);
      }

      this.logger.log(
        `Successfully fetched tontine ${id} for user ${user?.username}`,
        'TontineController',
      );
      return tontine;
    } catch (error) {
      this.logger.logException(error, 'TontineController');
      throw error;
    }
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

  @Get(':id/config/part-order')
  getPartOrder(@Param('id') id: string) {
    return this.tontineService.getPartOrder(+id);
  }

  @Post(':id/config/part-order')
  @Roles(Role.PRESIDENT)
  createPartOrder(@Param('id') tontineId: string, @Body() data: PartOrderDto) {
    return this.tontineService.createPartOrder(+tontineId, data);
  }

  @Patch(':id/config/part-order/:partOrderId')
  @Roles(Role.PRESIDENT)
  updatePartOrder(
    @Param('id') tontineId: string,
    @Param('partOrderId') partOrderId: string,
    @Body() data: PartOrderDto,
  ) {
    return this.tontineService.updatePartOrder(+tontineId, +partOrderId, data);
  }

  @Delete(':id/config/part-order/:partOrderId')
  @Roles(Role.PRESIDENT)
  deletePartOrder(
    @Param('id') tontineId: string,
    @Param('partOrderId') partOrderId: string,
  ) {
    return this.tontineService.deletePartOrder(+tontineId, +partOrderId);
  }

  @Patch(':id/member')
  @Roles(Role.PRESIDENT)
  addMember(@Param('id') id: string, @Body() data: { memberId: number }) {
    console.log('addMember', id, data);
    return this.tontineService.addMember(+id, data.memberId);
  }

  @Post(':id/member')
  @Roles(Role.PRESIDENT)
  addMemberFromScratch(@Param('id') id: string, @Body() data: CreateMemberDto) {
    return this.tontineService.addMemberFromScratch(+id, data);
  }

  @Delete(':id/member/:memberId')
  @Roles(Role.PRESIDENT)
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.tontineService.removeMember(+id, +memberId);
  }

  @Delete(':id')
  @Roles(Role.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.tontineService.remove(+id);
  }

  @Get(':id/rapport')
  @Roles(Role.TONTINARD)
  async getRapports(@Param('id') id: string) {
    return this.tontineService.getRapports(+id);
  }

  @Post(':id/rapport')
  @Roles(Role.ACCOUNT_MANAGER)
  async createRapport(
    @Req() req: any,
    @Param('id') id: string,
    @Body() rapport: CreateMeetingRapportDto,
  ) {
    if (rapport.attachment) {
      // Décode et sauvegarde le fichier
      //
      const fileName = `${Date.now()}-${rapport.attachmentFilename}`;
      const filePath = `./${this.relativePathUploadFiles}${fileName}`;

      await fs.promises.writeFile(
        filePath,
        Buffer.from(rapport.attachment, 'base64'),
      );

      rapport.attachmentFilename = fileName;
    }

    return this.tontineService.createRapport(+id, req.user.username, rapport);
  }

  @Patch(':id/rapport')
  @Roles(Role.ACCOUNT_MANAGER)
  updateRapport(
    @Param('id') id: string,
    @Body() rapport: CreateMeetingRapportDto,
  ) {
    return this.tontineService.updateRapport(+id, rapport);
  }

  @Delete(':id/rapport/:rapportId')
  @Roles(Role.ACCOUNT_MANAGER)
  deleteRapport(
    @Param('id') id: string,
    @Param('rapportId') rapportId: string,
  ) {
    return this.tontineService.removeRapport(+id, +rapportId);
  }

  @Get(':id/rapport/:rapportId/attachment')
  @Roles(Role.TONTINARD)
  async getAttachment(
    @Param('id') id: string,
    @Param('rapportId') rapportId: string,
  ) {
    const tontine = await this.tontineService.findOne(+id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const rapport = await this.tontineService.getRapport(+rapportId);
    if (!rapport) {
      throw new NotFoundException('Rapport not found');
    }
    const file = fs.readFileSync(
      `${this.relativePathUploadFiles}${rapport.attachmentFilename}`,
    );
    return file;
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
    return this.tontineService.createDeposit(
      +id,
      createDepositDto,
      status,
      user,
    );
  }

  @Patch(':id/deposit/:depositId')
  @Roles(Role.TONTINARD)
  updateDeposit(
    @Param('id') id: string,
    @Param('depositId') depositId: string,
    @Body() createDepositDto: CreateDepositDto,
    @Req() req: any,
  ) {
    return this.tontineService.updateDeposit(
      +id,
      +depositId,
      createDepositDto,
      req.user,
    );
  }

  @Delete(':id/deposit/:depositId')
  @Roles(Role.ACCOUNT_MANAGER)
  deleteDeposit(
    @Param('id') id: string,
    @Param('depositId') depositId: string,
    @Req() req: any,
  ) {
    return this.tontineService.removeDeposit(+id, +depositId, req.user);
  }
}
