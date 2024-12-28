import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { User } from 'src/authentification/entities/user.entity';
import { Member } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/member.service';
import { ErrorCode } from 'src/shared/utilities/error-code';
import { DataSource } from 'typeorm';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateMeetingRapportDto } from './dto/create-meeting-rapport.dto';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import {
  CreateConfigTontineDto,
  createToConfigTontineDtoToConfigTontine,
  CreateTontineDto,
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

@Injectable()
export class TontineService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberService: MemberService,
  ) { }

  async findByMember(username: string): Promise<Tontine[]> {
    const member = await this.memberService.findByUsername(username);
    if (!member) {
      return [];
    }
    return await this.findTontineByMember(member);
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
            memberDto.username,
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
      relations: ['members', 'members.user', 'config', 'cashFlow'],
    });
    return tontines.then((tontines) =>
      tontines.filter((tontine) =>
        tontine.members.find((m) => m.id === member.id),
      ),
    );
  }

  findOne(id: number): Promise<Tontine> {
    return this.getTontineQueryBuilder()
      .innerJoinAndSelect('members.user', 'user')
      .where('tontine.id = :id', { id })
      .getOne();
  }

  async addMember(id: number, memberId: number): Promise<Tontine> {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

    const member = await this.memberService.findOne(memberId);
    if (!member) {
      throw new HttpException(ErrorCode.NOT_FOUND, 404);
    }

    if (tontine.members.find((m) => m.id === member.id)) {
      throw new HttpException(ErrorCode.ALREADY_EXISTS, 400);
    }

    tontine.members.push(member);
    return this.dataSource.getRepository(Tontine).save(tontine);
  }

  async update(id: number, updateTontineDto: UpdateTontineDto) {
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
    return `This action removes a #${id} tontine`;
  }

  async createRapport(
    id: number,
    username: string,
    rapport: CreateMeetingRapportDto,
  ): Promise<any> {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

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

    return this.dataSource.getRepository(RapportMeeting).save(rapportMeeting);
  }

  async updateRapport(id: number, rapport: CreateMeetingRapportDto) {
    const rapportMeeting = await this.dataSource
      .getRepository(RapportMeeting)
      .findOne({ where: { id } });
    if (!rapportMeeting) {
      throw new HttpException('Rapport not found', 404);
    }

    return this.dataSource.getRepository(RapportMeeting).save({
      ...rapportMeeting,
      ...rapport,
      updatedAt: new Date(),
    });
  }

  async removeRapport(id: number) {
    const rapportMeeting = await this.dataSource
      .getRepository(RapportMeeting)
      .findOne({ where: { id } });
    if (!rapportMeeting) {
      throw new HttpException('Rapport not found', 404);
    }

    return this.dataSource.getRepository(RapportMeeting).remove(rapportMeeting);
  }

  async createSanction(tontineId: number, sanctionDto: CreateSanctionDto) {
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
      .innerJoinAndSelect('tontine.cashFlow', 'cashFlow');
  }

  // deposit part
  async createDeposit(
    tontineId: number,
    createDepositDto: CreateDepositDto,
    status: StatusDeposit,
  ) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

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
    deposit.creationDate = new Date();
    deposit.reasons = createDepositDto.reasons;
    deposit.status = status;
    deposit.cashFlow = tontine.cashFlow;
    deposit.currency = createDepositDto.currency;

    // update cashflow
    const cashflow = await this.dataSource
      .getRepository(CashFlow)
      .findOne({ where: { id: tontine.cashFlow.id } });
    if (!cashflow) {
      throw new NotFoundException('Cashflow not found');
    }

    await this.updateCashflow(createDepositDto.cashFlowId, deposit.amount);

    return this.dataSource.getRepository(Deposit).save(deposit);
  }

  private async updateCashflow(cashFlowId: number, amount: number) {
    const cashflow = await this.dataSource
      .getRepository(CashFlow)
      .findOne({ where: { id: cashFlowId } });
    if (!cashflow) {
      throw new NotFoundException('Cashflow not found');
    }
    // add all deposit attached to this tontine
    const deposits = await this.dataSource
      .getRepository(Deposit)
      .find({ where: { cashFlow: { id: cashFlowId } } });
    const totalDeposit = deposits
      .filter((deposit) => deposit.status === StatusDeposit.APPROVED)
      .reduce((acc, deposit) => acc + deposit.amount, 0);
    cashflow.amount = totalDeposit + amount;
    await this.dataSource.getRepository(CashFlow).save(cashflow);
  }

  async updateDeposit(
    id: number,
    depositId: number,
    deposit: CreateDepositDto,
  ) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

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

    return this.dataSource.getRepository(Deposit).save({
      ...depositFind,
      ...deposit,
    });
  }

  async removeDeposit(id: number, depositId: number) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const deposit = await this.dataSource
      .getRepository(Deposit)
      .findOne({ where: { id: depositId } });
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    return this.dataSource.getRepository(Deposit).remove(deposit);
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

  async getDeposits(id: number) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const deposits = await this.dataSource.getRepository(Deposit).find({
      where: { cashFlow: { id: tontine.cashFlow.id } },
      relations: ['author', 'cashFlow', 'author.user'],
    });
    return deposits;
  }

  async updateConfig(id: number, updateConfigDto: CreateConfigTontineDto) {
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
    const rateMaps = updateConfigDto.rateMaps?.map((rateMap) => {
      const rateMapEntity = new RateMap();
      rateMapEntity.rate = rateMap.rate;
      rateMapEntity.maxAmount = rateMap.maxAmount;
      rateMapEntity.minAmount = rateMap.minAmount;
      return rateMapEntity;
    });
    config.rateMaps = rateMaps;
    // tontine.config = config;
    return this.dataSource.getRepository(ConfigTontine).save(config);
  }

  async getMemberRole(
    username: string,
    tontineId: number,
  ): Promise<MemberRole> {
    return this.dataSource.getRepository(MemberRole).findOne({
      where: {
        user: { username },
        tontine: { id: tontineId },
      },
      relations: ['user', 'tontine'],
    });
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
}
