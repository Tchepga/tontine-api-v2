import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { SkipTontineContext } from 'src/authentification/entities/roles/skip-tontine-context.decorator';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { GetDepositsQueryDto } from './dto/get-deposits-query.dto';
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
import { CreateMemberDto } from 'src/member/dto/create-member.dto';
import { UpdateMemberRolesDto } from './dto/update-member-roles.dto';
import { RestartTontineDto } from './dto/restart-tontine.dto';

@UseGuards(RolesGuard)
@Controller('tontine')
export class TontineController {
  private relativePathUploadFiles = 'upload/rapports/';
  constructor(
    private readonly tontineService: TontineService,
    private readonly userService: AuthentificationService
  ) { }

  @Post()
  @SkipTontineContext()
  @Roles(Role.TONTINARD)
  create(@Body() createTontineDto: CreateTontineDto) {
    return this.tontineService.create(createTontineDto);
  }

  @Get(':id')
  @Roles(Role.TONTINARD)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = await this.userService.findByUsername(req?.user?.username);
    const tontine = await this.tontineService.findOneWithScopedRoles(+id);

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

  @Post(':id/close')
  @Roles(Role.PRESIDENT)
  closeTontine(@Param('id') id: string) {
    return this.tontineService.closeTontine(+id);
  }

  @Get(':id/closure-summary')
  @Roles(Role.TONTINARD)
  getClosureSummary(@Param('id') id: string, @Req() req: any) {
    return this.tontineService.getClosureSummary(+id, req.user.username);
  }

  @Post(':id/restart')
  @Roles(Role.PRESIDENT)
  restartTontine(
    @Param('id') id: string,
    @Body() restartTontineDto: RestartTontineDto,
  ) {
    return this.tontineService.restartTontine(+id, restartTontineDto);
  }

  @Get('member/:username')
  @SkipTontineContext()
  @Roles(Role.TONTINARD)
  async findByMember(
    @Param('username') username: string,
    @Req() req: any,
  ): Promise<Tontine[]> {
    if (req.user?.username !== username) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que vos propres tontines.',
      );
    }

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
    @Body() updateConfigDto: CreateConfigTontineDto
  ) {
    return this.tontineService.updateConfig(+id, updateConfigDto);
  }

  @Get(':id/config/part-order')
  @Roles(Role.TONTINARD)
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
  updatePartOrder(@Param('id') tontineId: string, @Param('partOrderId') partOrderId: string, @Body() data: PartOrderDto) {
    return this.tontineService.updatePartOrder(+tontineId, +partOrderId, data);
  }

  @Delete(':id/config/part-order/:partOrderId')
  @Roles(Role.PRESIDENT)
  deletePartOrder(@Param('id') tontineId: string, @Param('partOrderId') partOrderId: string) {
    return this.tontineService.deletePartOrder(+tontineId, +partOrderId);
  }

  @Patch(':id/member')
  @Roles(Role.PRESIDENT)
  addMember(@Param('id') id: string, @Body() data: { memberId: number }) {
    console.log("addMember", id, data);
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

  @Patch(':id/member/:memberId/roles')
  @Roles(Role.PRESIDENT)
  updateMemberRoles(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRolesDto: UpdateMemberRolesDto,
  ) {
    return this.tontineService.updateMemberRoles(
      +id,
      +memberId,
      updateMemberRolesDto.roles,
    );
  }

  @Delete(':id')
  @Roles(Role.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.tontineService.remove(+id);
  }

  @Get(':id/rapport')
  @Roles(Role.TONTINARD)
  async getRapports(@Param('id') id: string, @Req() req: any) {
    return this.tontineService.getRapports(+id, req.user.username);
  }

  @Post(':id/rapport')
  @Roles(Role.ACCOUNT_MANAGER)
  async createRapport(
    @Req() req: any,
    @Param('id') id: string,
    @Body() rapport: CreateMeetingRapportDto
  ) {
    if (rapport.attachment) {
      // Décode et sauvegarde le fichier
      //
      const fileName = `${Date.now()}-${rapport.attachmentFilename}`;
      const filePath = `./${this.relativePathUploadFiles}${fileName}`;

      await fs.promises.writeFile(
        filePath,
        Buffer.from(rapport.attachment, 'base64')
      );

      rapport.attachmentFilename = fileName;
    }

    return this.tontineService.createRapport(+id, req.user.username, rapport);
  }

  @Patch(':id/rapport/:rapportId')
  @Roles(Role.ACCOUNT_MANAGER)
  updateRapport(
    @Param('id') id: string,
    @Param('rapportId') rapportId: string,
    @Body() rapport: CreateMeetingRapportDto,
    @Req() req: any,
  ) {
    return this.tontineService.updateRapport(
      +id,
      +rapportId,
      rapport,
      req.user.username,
    );
  }

  @Delete(':id/rapport/:rapportId')
  @Roles(Role.ACCOUNT_MANAGER)
  deleteRapport(
    @Param('id') id: string,
    @Param('rapportId') rapportId: string,
    @Req() req: any,
  ) {
    return this.tontineService.removeRapport(+id, +rapportId, req.user.username);
  }

  @Get(':id/rapport/:rapportId/attachment')
  @Roles(Role.TONTINARD)
  async getAttachment(
    @Param('id') id: string,
    @Param('rapportId') rapportId: string,
    @Req() req: any,
  ) {
    const rapport = await this.tontineService.getRapport(
      +id,
      +rapportId,
      req.user.username,
    );
    if (!rapport) {
      throw new NotFoundException('Rapport not found');
    }
    const file = fs.readFileSync(
      `${this.relativePathUploadFiles}${rapport.attachmentFilename}`
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
    @Body() sanction: any
  ) {
    return this.tontineService.updateSanction(+id, +sanctionId, sanction);
  }

  @Delete(':id/sanction/:sanctionId')
  @Roles(Role.OFFICE_MANAGER)
  deleteSanction(
    @Param('id') id: string,
    @Param('sanctionId') sanctionId: string
  ) {
    return this.tontineService.removeSanction(+id, +sanctionId);
  }

  // Deposist part
  @Get(':id/members/contributions')
  @Roles(Role.ACCOUNT_MANAGER)
  getMembersContributions(@Param('id') id: string, @Req() req: any) {
    return this.tontineService.getMembersContributions(+id, req.user.username);
  }

  @Get(':id/deposit')
  @Roles(Role.TONTINARD)
  getDeposit(
    @Param('id') id: string,
    @Query() query: GetDepositsQueryDto,
    @Req() req: any,
  ) {
    return this.tontineService.getDeposits(+id, req.user.username, query);
  }

  @Post(':id/deposit')
  @Roles(Role.TONTINARD)
  createDeposit(
    @Param('id') id: string,
    @Body() createDepositDto: CreateDepositDto,
    @Req() req: any
  ) {
    const user = req.user;
    let status: StatusDeposit = StatusDeposit.PENDING;
    if (
      user.role.find(
        (role) => role === Role.PRESIDENT || role === Role.ACCOUNT_MANAGER
      )
    ) {
      status = StatusDeposit.APPROVED;
    }
    return this.tontineService.createDeposit(+id, createDepositDto, status, user);
  }

  @Patch(':id/deposit/:depositId')
  @Roles(Role.TONTINARD)
  updateDeposit(
    @Param('id') id: string,
    @Param('depositId') depositId: string,
    @Body() createDepositDto: CreateDepositDto,
    @Req() req: any
  ) {
    return this.tontineService.updateDeposit(+id, +depositId, createDepositDto, req.user);
  }

  @Delete(':id/deposit/:depositId')
  @Roles(Role.ACCOUNT_MANAGER)
  deleteDeposit(
    @Param('id') id: string,
    @Param('depositId') depositId: string,
    @Req() req: any
  ) {
    return this.tontineService.removeDeposit(+id, +depositId, req.user);
  }

}