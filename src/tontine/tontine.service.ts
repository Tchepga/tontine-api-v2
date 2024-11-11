import { Injectable } from '@nestjs/common';
import {
  createToConfigTontineDtoToConfigTontine,
  CreateTontineDto,
} from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { DataSource } from 'typeorm';
import { CashFlow } from './entities/cashflow.entity';
import { Member } from 'src/member/entities/member.entity';
import { createToMemberDtoToMember } from 'src/member/dto/create-member.dto';

@Injectable()
export class TontineService {
  constructor(private readonly dataSource: DataSource) {}
  async create(createTontineDto: CreateTontineDto) {
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

      const members = createTontineDto.members
        .map((member) => createToMemberDtoToMember(member))
        .map((member) => {
          return queryRunner.manager.save(member);
        });

      await queryRunner.manager.save({
        ...createTontineDto,
        cashflow: cashflowSaved,
        config: configTontine,
        members,
      });
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.log(err);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  findAll() {
    return `This action returns all tontine`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tontine`;
  }

  update(id: number, updateTontineDto: UpdateTontineDto) {
    return `This action updates a #${id} tontine`;
  }

  remove(id: number) {
    return `This action removes a #${id} tontine`;
  }
}
