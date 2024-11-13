import { HttpException, Injectable } from '@nestjs/common';
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
          return await (this.memberService.findByUsername(memberDto.username) ??
            this.memberService.create(memberDto));
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
      return tontine;
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.log(err);
      throw new HttpException(err, 500);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  findTontineByMember(member: Member): Promise<Tontine[]> {
    return this.dataSource
      .getRepository(Tontine)
      .createQueryBuilder('tontine')
      .leftJoinAndSelect('tontine.members', 'members')
      .where('members.id = :id', { id: member.id })
      .getMany();
  }

  findOne(id: number): Promise<Tontine> {
    return this.dataSource.getRepository(Tontine).findOne({ where: { id } });
  }

  async addMember(id: number, username: string): Promise<Tontine> {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

    const member = await this.memberService.findByUsername(username);
    if (!member) {
      throw new HttpException(ErrorCode.NOT_FOUND, 404);
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
    });
  }

  remove(id: number) {
    return `This action removes a #${id} tontine`;
  }
}
