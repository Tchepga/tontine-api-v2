import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Member } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/member.service';
import { DataSource } from 'typeorm';
import {
  createToConfigTontineDtoToConfigTontine,
  CreateTontineDto,
} from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { CashFlow } from './entities/cashflow.entity';
import { Tontine } from './entities/tontine.entity';
import { ErrorCode } from 'src/shared/utilities/error-code';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { CreateMeetingRapportDto } from './dto/create-meeting-rapport.dto';
import { RapportMeeting } from './entities/rapport-meeting.entity';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import { Sanction } from './entities/sanction.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { Deposit } from './entities/deposit.entity';
import { StatusDeposit } from './enum/status-deposit';

@Injectable()
export class TontineService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberService: MemberService,
  ) {}

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
              roles: [Role.PRESIDENT],
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
    return (
      this.getTontineQueryBuilder()
        .innerJoinAndSelect('members.user', 'user')
        // .innerJoinAndSelect('tontine.cashFlow', 'cashFlow')
        // .innerJoinAndSelect('tontine.casflow.deposit', 'deposit')
        .where('members.id = :id', { id: member.id })
        .getMany()
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
  async createDeposit(tontineId: number, createDepositDto: CreateDepositDto) {
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
    deposit.status = StatusDeposit.PENDING;
    deposit.currency = createDepositDto.currency;

    return this.dataSource.getRepository(Deposit).save(deposit);
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
}
