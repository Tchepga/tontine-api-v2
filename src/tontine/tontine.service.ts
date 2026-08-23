import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { User } from 'src/authentification/entities/user.entity';
import { Member } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/member.service';
import { ErrorCode } from 'src/shared/utilities/error-code';
import { DataSource } from 'typeorm';
import { CreateDepositDto } from './dto/create-deposit.dto';
import {
  DEPOSITS_DEFAULT_LIMIT,
  DEPOSITS_DEFAULT_PAGE,
  DEPOSITS_MAX_LIMIT,
  DepositStatusFilter,
  GetDepositsQueryDto,
} from './dto/get-deposits-query.dto';
import { DepositType } from './enum/deposit-type';
import { PaginatedDepositsResponse } from './types/paginated-deposits';
import { CreateMeetingRapportDto } from './dto/create-meeting-rapport.dto';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import {
  CreateConfigTontineDto,
  createToConfigTontineDtoToConfigTontine,
  CreateTontineDto,
  PartOrderDto,
} from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { CashFlow } from './entities/cashflow.entity';
import { ConfigTontine } from './entities/config-tontine.entity';
import { Deposit } from './entities/deposit.entity';
import { MemberRole } from './entities/member-role.entity';
import { RapportMeeting } from './entities/rapport-meeting.entity';
import { RateMap } from './entities/rate-map.entity';
import { Sanction } from './entities/sanction.entity';
import { Tontine } from './entities/tontine.entity';
import { StatusDeposit } from './enum/status-deposit';
import { Action } from 'src/notification/utility/message-notification';
import { NotificationService } from 'src/notification/notification.service';
import { TypeNotification } from 'src/notification/enum/type-notification';
import { SystemType } from './enum/system-type';
import { PartOrder } from './entities/part-order.entity';
import { CreateMemberDto } from 'src/member/dto/create-member.dto';
import { isMemberOfTontine } from './utilities/service.helper';
import { RestartTontineDto } from './dto/restart-tontine.dto';
import { TontineStatus } from './enum/tontine-status';
import {
  ClosureSnapshot,
  ClosureSummaryResponse,
  MemberClosureShare,
  MemberContribution,
} from './types/closure-snapshot';

interface MemberDepositStats {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  depositCount: number;
  lastDeposit: Date | null;
}

@Injectable()
export class TontineService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly memberService: MemberService,
    private readonly notificationService: NotificationService,
  ) { }

  async findByMember(username: string): Promise<Tontine[]> {
    const member = await this.memberService.findByUsername(username);
    if (!member) {
      return [];
    }
    const tontines = await this.findTontineByMember(member);
    return Promise.all(
      tontines.map((tontine) => this.withTontineScopedRoles(tontine)),
    );
  }

  async create(createTontineDto: CreateTontineDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const config = createToConfigTontineDtoToConfigTontine(
        createTontineDto.config,
      );
      const configTontine = await queryRunner.manager.save(config);

      const cashflow = new CashFlow();
      cashflow.amount = 0;
      cashflow.currency = createTontineDto.currency;
      cashflow.dividendes = 0;
      const cashflowSaved = await queryRunner.manager.save(cashflow);

      const members = await Promise.all(
        createTontineDto.members.map(async (memberDto) => {
          const memberFind = await this.memberService.findByUsername(
            this.memberService.buildUsernameForMember(
              memberDto.firstname,
              memberDto.lastname,
            ),
          );
          if (!memberFind) {
            return await this.memberService.create({
              ...memberDto,
            });
          }
          return memberFind;
        }),
      );

      const tontine = new Tontine();
      tontine.title = createTontineDto.title;
      tontine.legacy = createTontineDto.legacy;
      tontine.cashFlow = cashflowSaved;
      tontine.config = configTontine;
      tontine.members = members;
      tontine.status = TontineStatus.ACTIVE;
      await queryRunner.manager.save(tontine);

      // just the first member is the president
      const roleMember = new MemberRole();
      roleMember.role = Role.PRESIDENT;
      roleMember.user = members[0].user;
      roleMember.tontine = tontine;
      await queryRunner.manager.save(roleMember);

      await queryRunner.commitTransaction();
      return {
        ...tontine,
        members: tontine.members.map((member) => ({
          ...member,
          user: { username: member.user.username, roles: member.user.roles },
        })),
      };
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new HttpException(err, 500);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  findTontineByMember(member: Member): Promise<Tontine[]> {
    const tontines = this.dataSource.getRepository(Tontine).find({
      relations: [
        'members',
        'members.user',
        'config',
        'config.partOrders',
        'config.partOrders.member',
        'config.partOrders.member.user',
        'cashFlow',
      ],
    });
    return tontines.then((tontines) =>
      tontines.filter((tontine) =>
        tontine.members.find((m) => m.id === member.id),
      ),
    );
  }

  /** Vérifie l'appartenance à une tontine avant accès aux ressources scopées. */
  async assertIsMemberOfTontine(
    tontineId: number,
    username: string,
  ): Promise<Tontine> {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    if (!isMemberOfTontine(tontine, username)) {
      throw new ForbiddenException(
        "Vous n'êtes pas membre de cette tontine.",
      );
    }
    return tontine;
  }

  /** Bloque toute écriture sur une tontine clôturée. */
  async assertTontineWritable(tontineId: number): Promise<Tontine> {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    if (tontine.status === TontineStatus.CLOSED) {
      throw new BadRequestException({
        message: 'Cette tontine est clôturée et ne peut plus être modifiée.',
        errorCode: ErrorCode.TONTINE_CLOSED,
      });
    }
    return tontine;
  }

  async closeTontine(tontineId: number): Promise<{
    tontine: Tontine;
    closureSummary: ClosureSummaryResponse;
  }> {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    if (tontine.status === TontineStatus.CLOSED) {
      throw new BadRequestException({
        message: 'Cette tontine est déjà clôturée.',
        errorCode: ErrorCode.TONTINE_ALREADY_CLOSED,
      });
    }

    const memberShares = await this.computeMemberShares(tontine);
    const closedAt = new Date();
    const closureSnapshot: ClosureSnapshot = {
      remainingBalance: tontine.cashFlow.amount,
      currency: tontine.cashFlow.currency,
      cashflowAmount: tontine.cashFlow.amount,
      dividendes: tontine.cashFlow.dividendes,
      memberShares,
    };

    tontine.status = TontineStatus.CLOSED;
    tontine.closedAt = closedAt;
    tontine.closureSnapshot = closureSnapshot;

    const saved = await this.dataSource.getRepository(Tontine).save(tontine);

    return {
      tontine: saved,
      closureSummary: this.buildClosureSummary(saved),
    };
  }

  async getClosureSummary(
    tontineId: number,
    username: string,
  ): Promise<ClosureSummaryResponse> {
    const tontine = await this.assertIsMemberOfTontine(tontineId, username);
    if (tontine.status !== TontineStatus.CLOSED) {
      throw new BadRequestException({
        message: 'Le récapitulatif de clôture est disponible uniquement pour une tontine clôturée.',
        errorCode: ErrorCode.TONTINE_NOT_CLOSED,
      });
    }
    if (!tontine.closureSnapshot) {
      throw new NotFoundException('Récapitulatif de clôture introuvable.');
    }
    return this.buildClosureSummary(tontine);
  }

  async restartTontine(
    tontineId: number,
    restartDto: RestartTontineDto,
  ): Promise<Tontine> {
    const source = await this.findOne(tontineId);
    if (!source) {
      throw new NotFoundException('Tontine not found');
    }
    if (source.status !== TontineStatus.CLOSED) {
      throw new BadRequestException({
        message: 'Seule une tontine clôturée peut être relancée.',
        errorCode: ErrorCode.TONTINE_NOT_CLOSED,
      });
    }

    const carryOverCash = restartDto.carryOverCash ?? true;
    const reliquat = source.closureSnapshot?.remainingBalance ?? 0;

    const sourceConfig = await this.dataSource
      .getRepository(ConfigTontine)
      .findOne({
        where: { id: source.config.id },
        relations: ['rateMaps'],
      });
    if (!sourceConfig) {
      throw new NotFoundException('Config not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const config = this.cloneConfig(sourceConfig);
      const configSaved = await queryRunner.manager.save(config);

      const cashflow = new CashFlow();
      cashflow.currency = source.cashFlow.currency;
      cashflow.dividendes = 0;
      cashflow.amount = carryOverCash ? reliquat : 0;
      const cashflowSaved = await queryRunner.manager.save(cashflow);

      const newTontine = new Tontine();
      newTontine.title = restartDto.name?.trim() || `${source.title} (suite)`;
      newTontine.legacy = source.legacy;
      newTontine.config = configSaved;
      newTontine.cashFlow = cashflowSaved;
      newTontine.members = [...source.members];
      newTontine.status = TontineStatus.ACTIVE;
      newTontine.parentTontineId = source.id;
      newTontine.isSelected = false;

      const tontineSaved = await queryRunner.manager.save(newTontine);

      const memberRoleRepo = queryRunner.manager.getRepository(MemberRole);
      const sourceRoles = await memberRoleRepo.find({
        where: { tontine: { id: source.id } },
        relations: ['user'],
      });

      for (const sourceRole of sourceRoles) {
        const memberRole = new MemberRole();
        memberRole.user = sourceRole.user;
        memberRole.tontine = tontineSaved;
        memberRole.role = sourceRole.role;
        await memberRoleRepo.save(memberRole);
      }

      await queryRunner.commitTransaction();
      return this.findOneWithScopedRoles(tontineSaved.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private buildClosureSummary(tontine: Tontine): ClosureSummaryResponse {
    const snapshot = tontine.closureSnapshot;
    return {
      tontineId: tontine.id,
      closedAt: tontine.closedAt,
      remainingBalance: snapshot.remainingBalance,
      currency: snapshot.currency,
      memberShares: snapshot.memberShares,
    };
  }

  private cloneConfig(source: ConfigTontine): ConfigTontine {
    const config = new ConfigTontine();
    config.defaultLoanRate = source.defaultLoanRate;
    config.defaultLoanDuration = source.defaultLoanDuration;
    config.loopPeriod = source.loopPeriod;
    config.minLoanAmount = source.minLoanAmount;
    config.countPersonPerMovement = source.countPersonPerMovement;
    config.movementType = source.movementType;
    config.countMaxMember = source.countMaxMember;
    config.systemType = source.systemType;
    config.rateMaps =
      source.rateMaps?.map((rateMap) => {
        const entity = new RateMap();
        entity.rate = rateMap.rate;
        entity.maxAmount = rateMap.maxAmount;
        entity.minAmount = rateMap.minAmount;
        return entity;
      }) ?? [];
    return config;
  }

  async getMembersContributions(
    tontineId: number,
    username: string,
  ): Promise<MemberContribution[]> {
    const tontine = await this.assertIsMemberOfTontine(tontineId, username);
    const deposits = await this.getDepositsForTontine(tontine.cashFlow.id);
    const statsByMember = this.aggregateDepositsByMember(deposits);

    const totalContributions = tontine.members.reduce(
      (acc, member) => acc + (statsByMember.get(member.id)?.totalApproved ?? 0),
      0,
    );
    const remainingBalance = tontine.cashFlow.amount;
    const memberCount = tontine.members.length;

    return tontine.members.map((member) => {
      const stats = statsByMember.get(member.id) ?? {
        totalApproved: 0,
        totalPending: 0,
        totalRejected: 0,
        depositCount: 0,
        lastDeposit: null,
      };
      const { shareAmount, sharePercent } = this.computeShareAmounts(
        stats.totalApproved,
        totalContributions,
        remainingBalance,
        memberCount,
      );

      return {
        memberId: member.id,
        firstname: member.firstname,
        lastname: member.lastname,
        username: member.user?.username ?? '',
        totalApproved: stats.totalApproved,
        totalPending: stats.totalPending,
        totalRejected: stats.totalRejected,
        depositCount: stats.depositCount,
        lastDeposit: stats.lastDeposit?.toISOString() ?? null,
        sharePercent,
        shareAmount,
      };
    });
  }

  private async getDepositsForTontine(cashFlowId: number): Promise<Deposit[]> {
    return this.dataSource.getRepository(Deposit).find({
      where: { cashFlow: { id: cashFlowId } },
      relations: ['author', 'author.user'],
    });
  }

  private aggregateDepositsByMember(
    deposits: Deposit[],
  ): Map<number, MemberDepositStats> {
    const statsByMember = new Map<number, MemberDepositStats>();

    for (const deposit of deposits) {
      const memberId = deposit.author.id;
      const stats = statsByMember.get(memberId) ?? {
        totalApproved: 0,
        totalPending: 0,
        totalRejected: 0,
        depositCount: 0,
        lastDeposit: null,
      };

      stats.depositCount += 1;

      switch (deposit.status) {
        case StatusDeposit.APPROVED:
          stats.totalApproved += deposit.amount;
          break;
        case StatusDeposit.PENDING:
          stats.totalPending += deposit.amount;
          break;
        case StatusDeposit.REJECTED:
          stats.totalRejected += deposit.amount;
          break;
      }

      if (
        !stats.lastDeposit ||
        deposit.creationDate > stats.lastDeposit
      ) {
        stats.lastDeposit = deposit.creationDate;
      }

      statsByMember.set(memberId, stats);
    }

    return statsByMember;
  }

  private computeShareAmounts(
    totalApproved: number,
    totalContributions: number,
    remainingBalance: number,
    memberCount: number,
  ): { shareAmount: number; sharePercent: number } {
    let shareAmount = 0;
    let sharePercent = 0;

    if (totalContributions > 0) {
      sharePercent = (totalApproved / totalContributions) * 100;
      shareAmount = (totalApproved / totalContributions) * remainingBalance;
    } else if (memberCount > 0) {
      sharePercent = 100 / memberCount;
      shareAmount = remainingBalance / memberCount;
    }

    return {
      shareAmount: Math.round(shareAmount * 100) / 100,
      sharePercent: Math.round(sharePercent * 100) / 100,
    };
  }

  private async computeMemberShares(
    tontine: Tontine,
  ): Promise<MemberClosureShare[]> {
    const deposits = await this.getDepositsForTontine(tontine.cashFlow.id);
    const statsByMember = this.aggregateDepositsByMember(deposits);

    const totalContributions = tontine.members.reduce(
      (acc, member) => acc + (statsByMember.get(member.id)?.totalApproved ?? 0),
      0,
    );
    const remainingBalance = tontine.cashFlow.amount;
    const memberCount = tontine.members.length;

    return tontine.members.map((member) => {
      const totalDeposits = statsByMember.get(member.id)?.totalApproved ?? 0;
      const { shareAmount, sharePercent } = this.computeShareAmounts(
        totalDeposits,
        totalContributions,
        remainingBalance,
        memberCount,
      );

      return {
        memberId: member.id,
        firstname: member.firstname,
        lastname: member.lastname,
        totalDeposits,
        shareAmount,
        sharePercent,
      };
    });
  }

  findOne(id: number): Promise<Tontine> {
    return this.getTontineQueryBuilder()
      .innerJoinAndSelect('members.user', 'user')
      .where('tontine.id = :id', { id })
      .getOne();
  }

  /** Version destinée aux réponses client : rôles = MemberRole de la tontine. */
  async findOneWithScopedRoles(id: number): Promise<Tontine> {
    const tontine = await this.findOne(id);
    if (!tontine) {
      return tontine;
    }
    return this.withTontineScopedRoles(tontine);
  }

  async addMember(id: number, memberId: number): Promise<Tontine> {
    await this.assertTontineWritable(id);
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

    const member = await this.dataSource.getRepository(Member).findOne({
      where: { id: memberId },
      relations: ['user'],
    });
    if (!member) {
      throw new HttpException(ErrorCode.NOT_FOUND, 404);
    }

    if (tontine.members.find((m) => m.id === member.id)) {
      throw new HttpException(ErrorCode.ALREADY_EXISTS, 400);
    }

    tontine.members.push(member);
    await this.dataSource.getRepository(Tontine).save(tontine);

    // Rôle dans la tontine (source de vérité pour les droits)
    const existingRoles = await this.getMemberRoles(
      member.user.username,
      id,
    );
    if (existingRoles.length === 0) {
      await this.addMemberWithRole(id, member.user.username, Role.TONTINARD);
    }

    return this.findOneWithScopedRoles(id);
  }

  async update(id: number, updateTontineDto: UpdateTontineDto) {
    await this.assertTontineWritable(id);
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

    return this.dataSource.getRepository(Tontine).save({
      ...tontine,
      ...updateTontineDto,
      members: tontine.members,
    });
  }

  remove(id: number) {
    return this.dataSource.getRepository(Tontine).delete(id);
  }

  async getRapports(id: number, username: string) {
    await this.assertIsMemberOfTontine(id, username);
    return this.dataSource.getRepository(RapportMeeting).find({
      where: { tontine: { id } },
      relations: ['author', 'author.user'],
    });
  }

  async createRapport(
    id: number,
    username: string,
    rapport: CreateMeetingRapportDto,
  ): Promise<any> {
    await this.assertTontineWritable(id);
    const tontine = await this.assertIsMemberOfTontine(id, username);

    const member = tontine.members.find((m) => m.user.username === username);
    if (!member) {
      throw new HttpException('Member not found', 404);
    }

    const rapportMeeting = new RapportMeeting();
    rapportMeeting.content = rapport.content;
    rapportMeeting.title = rapport.title;
    rapportMeeting.author = member;
    rapportMeeting.tontine = tontine;
    rapportMeeting.createdAt = new Date();
    rapportMeeting.attachmentFilename = rapport.attachmentFilename;

    return this.dataSource.getRepository(RapportMeeting).save(rapportMeeting);
  }

  async updateRapport(
    tontineId: number,
    rapportId: number,
    rapport: CreateMeetingRapportDto,
    username: string,
  ) {
    await this.assertTontineWritable(tontineId);
    await this.assertIsMemberOfTontine(tontineId, username);

    const rapportMeeting = await this.dataSource
      .getRepository(RapportMeeting)
      .findOne({
        where: { id: rapportId, tontine: { id: tontineId } },
      });
    if (!rapportMeeting) {
      throw new HttpException('Rapport not found', 404);
    }

    return this.dataSource.getRepository(RapportMeeting).save({
      ...rapportMeeting,
      ...rapport,
      updatedAt: new Date(),
    });
  }

  async removeRapport(
    tontineId: number,
    rapportId: number,
    username: string,
  ) {
    await this.assertTontineWritable(tontineId);
    await this.assertIsMemberOfTontine(tontineId, username);

    const rapportMeeting = await this.dataSource
      .getRepository(RapportMeeting)
      .findOne({ where: { id: rapportId } });
    if (!rapportMeeting) {
      throw new HttpException('Rapport not found', 404);
    }

    return this.dataSource.getRepository(RapportMeeting).remove(rapportMeeting);
  }

  async getRapport(tontineId: number, rapportId: number, username: string) {
    await this.assertIsMemberOfTontine(tontineId, username);
    return this.dataSource.getRepository(RapportMeeting).findOne({
      where: { id: rapportId, tontine: { id: tontineId } },
      relations: ['author', 'author.user'],
    });
  }

  async createSanction(tontineId: number, sanctionDto: CreateSanctionDto) {
    await this.assertTontineWritable(tontineId);
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const member = await this.memberService.findOne(sanctionDto.memberId);
    if (!member) {
      throw new NotFoundException('Member associated not found');
    }

    const sanction = new Sanction();
    sanction.type = sanctionDto.type;
    sanction.description = sanctionDto.description;
    sanction.startDate = sanctionDto?.startDate ?? new Date();
    if (sanctionDto.endDate) {
      sanction.endDate = sanctionDto.endDate;
    }
    sanction.gulty = member;
    sanction.tontine = tontine;

    return this.dataSource.getRepository(Sanction).save(sanction);
  }

  async updateSanction(
    id: number,
    sanctionId: number,
    sanctionDto: CreateSanctionDto,
  ) {
    await this.assertTontineWritable(id);
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const sanction = await this.dataSource
      .getRepository(Sanction)
      .findOne({ where: { id: sanctionId } });
    if (!sanction) {
      throw new NotFoundException('Sanction not found');
    }

    return this.dataSource.getRepository(Sanction).save({
      ...sanction,
      ...sanctionDto,
    });
  }

  async removeSanction(id: number, sanctionId: number) {
    await this.assertTontineWritable(id);
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const sanction = await this.dataSource
      .getRepository(Sanction)
      .findOne({ where: { id: sanctionId } });
    if (!sanction) {
      throw new NotFoundException('Sanction not found');
    }

    return this.dataSource.getRepository(Sanction).remove(sanction);
  }

  private getTontineQueryBuilder() {
    return this.dataSource
      .getRepository(Tontine)
      .createQueryBuilder('tontine')
      .innerJoinAndSelect('tontine.members', 'members')
      .innerJoinAndSelect('tontine.config', 'config')
      .innerJoinAndSelect('tontine.cashFlow', 'cashFlow')
      .leftJoinAndSelect('config.partOrders', 'partOrders')
      .leftJoinAndSelect('partOrders.member', 'partMember')
      .leftJoinAndSelect('partMember.user', 'partMemberUser');
  }

  // deposit part
  async createDeposit(
    tontineId: number,
    createDepositDto: CreateDepositDto,
    status: StatusDeposit,
    user: User,
  ) {
    await this.assertTontineWritable(tontineId);
    const tontine = await this.assertIsMemberOfTontine(tontineId, user.username);

    const member = await this.memberService.findOne(createDepositDto.memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const deposit = new Deposit();
    deposit.amount = createDepositDto.amount;
    const author = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { id: createDepositDto.memberId } });
    if (!author) {
      throw new NotFoundException(
        'Author not found with this member id: ' + createDepositDto.memberId,
      );
    }
    deposit.author = author;
    deposit.creationDate = createDepositDto.creationDate
      ? new Date(createDepositDto.creationDate)
      : new Date();
    deposit.reasons = createDepositDto.reasons;
    deposit.status = status;
    deposit.cashFlow = tontine.cashFlow;
    deposit.currency = createDepositDto.currency;

    // update cashflow
    const cashflow = await this.dataSource
      .getRepository(CashFlow)
      .findOne({
        where: { id: tontine.cashFlow.id },
        relations: ['deposits']
      });
    if (!cashflow) {
      throw new NotFoundException('Cashflow not found');
    }
    // Initialize deposits array if it doesn't exist
    if (!cashflow.deposits) {
      cashflow.deposits = [];
    }

    if (status === StatusDeposit.APPROVED) {
      await this.updateCashflow(createDepositDto.cashFlowId, deposit.amount);
    }

    const depositSaved = await this.dataSource
      .getRepository(Deposit)
      .save(deposit);

    this.notificationService.create({
      action: Action.CREATE,
      depositId: depositSaved.id,
      memberId: depositSaved.author.id,
      tontineId: tontine.id,
      type: TypeNotification.DEPOSIT,
    },
      user
    );

    return depositSaved;
  }


  private async updateCashflow(cashFlowId: number, amount: number) {
    const cashflow = await this.dataSource
      .getRepository(CashFlow)
      .findOne({
        where: { id: cashFlowId },
        relations: ['deposits']
      });
    if (!cashflow) {
      throw new NotFoundException('Cashflow not found');
    }

    // Initialize deposits array if it doesn't exist
    if (!cashflow.deposits) {
      cashflow.deposits = [];
    }

    // add all deposit attached to this tontine
    const deposits = await this.dataSource
      .getRepository(Deposit)
      .find({
        where: { cashFlow: { id: cashFlowId } },
        relations: ['cashFlow']
      });
    const totalDeposit = deposits
      .filter((deposit) => deposit.status === StatusDeposit.APPROVED)
      .reduce((acc, deposit) => acc + deposit.amount, 0);
    cashflow.amount = totalDeposit + amount;
    await this.dataSource.getRepository(CashFlow).save(cashflow);
  }

  /** Recalcule le cashflow à partir des dépôts APPROVED uniquement. */
  private async recalculateCashflow(cashFlowId: number) {
    const deposits = await this.dataSource.getRepository(Deposit).find({
      where: { cashFlow: { id: cashFlowId } },
    });
    const totalDeposit = deposits
      .filter((deposit) => deposit.status === StatusDeposit.APPROVED)
      .reduce((acc, deposit) => acc + deposit.amount, 0);

    const cashflow = await this.dataSource
      .getRepository(CashFlow)
      .findOne({ where: { id: cashFlowId } });
    if (!cashflow) {
      throw new NotFoundException('Cashflow not found');
    }
    cashflow.amount = totalDeposit;
    await this.dataSource.getRepository(CashFlow).save(cashflow);
  }

  async updateDeposit(
    id: number,
    depositId: number,
    deposit: CreateDepositDto,
    user: User,
  ) {
    await this.assertTontineWritable(id);
    const tontine = await this.assertIsMemberOfTontine(id, user.username);

    const depositFind = await this.dataSource
      .getRepository(Deposit)
      .findOne({ where: { id: depositId } });
    if (!depositFind) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.amount && depositFind.amount !== deposit.amount) {
      depositFind.status = StatusDeposit.PENDING;
      deposit.status = StatusDeposit.PENDING;
    }

    if (deposit.amount != null) {
      depositFind.amount = deposit.amount;
    }
    if (deposit.reasons != null) {
      depositFind.reasons = deposit.reasons;
    }
    if (deposit.currency != null) {
      depositFind.currency = deposit.currency;
    }
    if (deposit.creationDate) {
      depositFind.creationDate = new Date(deposit.creationDate);
    }
    if (deposit.status != null) {
      depositFind.status = deposit.status;
    }

    const depositSaved = await this.dataSource.getRepository(Deposit).save(depositFind);

    if (depositSaved.status === StatusDeposit.APPROVED) {
      await this.recalculateCashflow(tontine.cashFlow.id);
    }

    this.notificationService.create({
      action: Action.UPDATE,
      depositId: depositSaved.id,
      memberId: depositSaved.author.id,
      tontineId: tontine.id,
      type: TypeNotification.DEPOSIT,
    },
      user
    );

    return depositSaved;
  }

  async removeDeposit(id: number, depositId: number, user: User) {
    await this.assertTontineWritable(id);
    const tontine = await this.assertIsMemberOfTontine(id, user.username);

    const deposit = await this.dataSource.getRepository(Deposit).findOne({
      where: { id: depositId },
      relations: ['author'],
    });
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const member = await this.memberService.findByUsername(user.username);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const authorId = deposit.author?.id ?? member.id;
    const removedDepositId = deposit.id;

    await this.dataSource.getRepository(Deposit).remove(deposit);

    this.notificationService.create({
      action: Action.DELETE,
      depositId: removedDepositId,
      memberId: authorId,
      tontineId: tontine.id,
      type: TypeNotification.DEPOSIT,
    },
      user
    );

    return { id: removedDepositId };
  }

  async setSelectedTontine(id: number, username: string) {
    const member = await this.memberService.findByUsername(username);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    tontine.isSelected = true;
    return this.dataSource.getRepository(Tontine).save(tontine);
  }

  async getDeposits(
    id: number,
    username: string,
    query: GetDepositsQueryDto = {},
  ): Promise<PaginatedDepositsResponse> {
    const tontine = await this.assertIsMemberOfTontine(id, username);

    const page = query.page ?? DEPOSITS_DEFAULT_PAGE;
    const limit = Math.min(
      query.limit ?? DEPOSITS_DEFAULT_LIMIT,
      DEPOSITS_MAX_LIMIT,
    );

    const qb = this.dataSource
      .getRepository(Deposit)
      .createQueryBuilder('deposit')
      .leftJoinAndSelect('deposit.author', 'author')
      .leftJoinAndSelect('deposit.cashFlow', 'cashFlow')
      .leftJoinAndSelect('author.user', 'user')
      .where('deposit.cashFlowId = :cashFlowId', {
        cashFlowId: tontine.cashFlow.id,
      });

    if (query.status) {
      qb.andWhere('deposit.status = :status', {
        status: this.mapDepositStatusFilter(query.status),
      });
    }

    if (query.type === DepositType.FOND) {
      qb.andWhere('LOWER(deposit.reasons) LIKE :fondPrefix', {
        fondPrefix: 'fond%',
      });
    } else if (query.type === DepositType.COTISATION) {
      qb.andWhere(
        '(deposit.reasons IS NULL OR LOWER(deposit.reasons) NOT LIKE :fondPrefix)',
        { fondPrefix: 'fond%' },
      );
    }

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        '(LOWER(author.firstname) LIKE :search OR LOWER(author.lastname) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    qb.orderBy('deposit.creationDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  private mapDepositStatusFilter(
    status: DepositStatusFilter,
  ): StatusDeposit {
    if (status === 'VALIDATED') {
      return StatusDeposit.APPROVED;
    }
    return status as StatusDeposit;
  }

  async updateConfig(id: number, updateConfigDto: CreateConfigTontineDto) {
    await this.assertTontineWritable(id);
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const config = await this.dataSource
      .getRepository(ConfigTontine)
      .findOne({ where: { id: tontine.config.id } });
    if (!config) {
      throw new NotFoundException('Config not found');
    }

    if (updateConfigDto.defaultLoanRate !== undefined)
      config.defaultLoanRate = updateConfigDto.defaultLoanRate;
    if (updateConfigDto.defaultLoanDuration !== undefined)
      config.defaultLoanDuration = updateConfigDto.defaultLoanDuration;
    if (updateConfigDto.loopPeriod !== undefined)
      config.loopPeriod = updateConfigDto.loopPeriod;
    if (updateConfigDto.minLoanAmount !== undefined)
      config.minLoanAmount = updateConfigDto.minLoanAmount;
    if (updateConfigDto.countPersonPerMovement !== undefined)
      config.countPersonPerMovement = updateConfigDto.countPersonPerMovement;
    if (updateConfigDto.movementType !== undefined)
      config.movementType = updateConfigDto.movementType;
    if (updateConfigDto.countMaxMember !== undefined)
      config.countMaxMember = updateConfigDto.countMaxMember;
    if (updateConfigDto.systemType) {
      config.systemType = updateConfigDto.systemType;
    }

    const rateMaps = updateConfigDto.rateMaps?.map((rateMap) => {
      const rateMapEntity = new RateMap();
      rateMapEntity.rate = rateMap.rate;
      rateMapEntity.maxAmount = rateMap.maxAmount;
      rateMapEntity.minAmount = rateMap.minAmount;
      return rateMapEntity;
    });
    config.rateMaps = rateMaps;

    return this.dataSource.getRepository(ConfigTontine).save(config);
  }

  /**
   * Remplace user.roles (global) par les rôles MemberRole de cette tontine
   * pour l'affichage client. Ne pas persister User après cet appel.
   */
  private async withTontineScopedRoles(tontine: Tontine): Promise<Tontine> {
    if (!tontine?.members?.length) {
      return tontine;
    }

    const memberRoles = await this.dataSource.getRepository(MemberRole).find({
      where: { tontine: { id: tontine.id } },
      relations: ['user'],
    });

    const rolesByUsername = new Map<string, Role[]>();
    for (const memberRole of memberRoles) {
      const username = memberRole.user?.username;
      if (!username) {
        continue;
      }
      const key = username.toLowerCase();
      const roles = rolesByUsername.get(key) ?? [];
      roles.push(memberRole.role);
      rolesByUsername.set(key, roles);
    }

    for (const member of tontine.members) {
      if (!member.user?.username) {
        continue;
      }
      const scopedRoles = rolesByUsername.get(
        member.user.username.toLowerCase(),
      );
      member.user.roles =
        scopedRoles?.length > 0 ? [...scopedRoles] : [Role.TONTINARD];
    }

    return tontine;
  }

  async getMemberRoles(
    username: string,
    tontineId: number,
  ): Promise<MemberRole[]> {
    return this.dataSource.getRepository(MemberRole).find({
      where: {
        user: { username },
        tontine: { id: tontineId },
      },
      relations: ['user', 'tontine'],
    });
  }

  async getMemberRole(
    username: string,
    tontineId: number,
  ): Promise<MemberRole> {
    const roles = await this.getMemberRoles(username, tontineId);
    return roles[0] ?? null;
  }

  async addMemberWithRole(
    tontineId: number,
    username: string,
    role: Role,
  ): Promise<MemberRole> {
    const memberRole = new MemberRole();
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    memberRole.tontine = tontine;
    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    memberRole.user = user;
    memberRole.role = role;

    return this.dataSource.getRepository(MemberRole).save(memberRole);
  }

  async updateMemberRoles(
    tontineId: number,
    memberId: number,
    roles: Role[],
  ): Promise<{ roles: Role[] }> {
    await this.assertTontineWritable(tontineId);
    const uniqueRoles = [...new Set(roles)];
    if (uniqueRoles.length === 0) {
      throw new BadRequestException('Au moins un rôle est requis.');
    }

    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine introuvable.');
    }

    const member = tontine.members?.find((m) => m.id === memberId);
    if (!member?.user) {
      throw new NotFoundException(
        "Ce membre n'appartient pas à cette tontine.",
      );
    }

    const memberRoleRepo = this.dataSource.getRepository(MemberRole);
    const existing = await this.getMemberRoles(
      member.user.username,
      tontineId,
    );
    if (existing.length > 0) {
      await memberRoleRepo.remove(existing);
    }

    const saved = await Promise.all(
      uniqueRoles.map((role) => {
        const memberRole = new MemberRole();
        memberRole.user = member.user;
        memberRole.tontine = tontine;
        memberRole.role = role;
        return memberRoleRepo.save(memberRole);
      }),
    );

    return { roles: saved.map((memberRole) => memberRole.role) };
  }

  async removeMember(tontineId: number, memberId: number) {
    await this.assertTontineWritable(tontineId);
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const member = await this.dataSource.getRepository(Member).findOne({
      where: { id: memberId },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const memberRoles = await this.getMemberRoles(
      member.user.username,
      tontineId,
    );
    if (memberRoles.length > 0) {
      await this.dataSource.getRepository(MemberRole).remove(memberRoles);
    }
    tontine.members = tontine.members.filter((m) => m.id !== memberId);
    return this.dataSource.getRepository(Tontine).save(tontine);
  }

  async createPartOrder(tontineId: number, data: PartOrderDto) {
    await this.assertTontineWritable(tontineId);
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const member = await this.memberService.findOne(data.memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const partOrder = new PartOrder();
    partOrder.member = member;
    partOrder.order = data.order;
    partOrder.period = data.period;
    partOrder.config = tontine.config;
    return this.dataSource.getRepository(PartOrder).save(partOrder);
  }

  async updatePartOrder(tontineId: number, partOrderId: number, data: PartOrderDto) {
    await this.assertTontineWritable(tontineId);
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const partOrder = await this.dataSource.getRepository(PartOrder).findOne({
      where: { id: partOrderId },
    });
    if (!partOrder) {
      throw new NotFoundException('Part order not found');
    }
    const member = await this.memberService.findOne(data.memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    partOrder.member = member;
    partOrder.order = data.order;
    partOrder.period = data.period;
    return this.dataSource.getRepository(PartOrder).save(partOrder);
  }

  async deletePartOrder(tontineId: number, partOrderId: number) {
    await this.assertTontineWritable(tontineId);
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const partOrder = await this.dataSource.getRepository(PartOrder).findOne({
      where: { id: partOrderId },
    });
    if (!partOrder) {
      throw new NotFoundException('Part order not found');
    }
    return this.dataSource.getRepository(PartOrder).delete(partOrderId);
  }

  async getPartOrder(tontineId: number) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    return this.dataSource.getRepository(PartOrder).find({
      where: {
        config: { id: tontine.config.id },
      },
      relations: ['member', 'member.user'],
    });
  }

  async addMemberFromScratch(tontineId: number, data: CreateMemberDto) {
    await this.assertTontineWritable(tontineId);
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const member =
      (await this.memberService.findByUsername(
        this.memberService.buildUsernameForMember(
          data.firstname,
          data.lastname,
        ),
      )) ?? (await this.memberService.create(data));

    return this.addMember(tontineId, member.id);
  }
}
