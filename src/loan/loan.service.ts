import { BadRequestException, Injectable } from '@nestjs/common';
import { Member } from 'src/member/entities/member.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { DataSource } from 'typeorm';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { StatusLoan } from './enum/status-loan';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { User } from 'src/authentification/entities/user.entity';

@Injectable()
export class LoanService {
  constructor(private readonly dataSource: DataSource) { }

  async create(createLoanDto: CreateLoanDto, user: User) {
    const { amount, currency, tontineId } = createLoanDto;
    const tontine = await this.dataSource
      .getRepository(Tontine)
      .findOne({ where: { id: tontineId }, relations: ['config'] });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    const author = await this.dataSource.getRepository(Member).findOne({
      where: { user: { username: user.username } },
    });
    if (!author) {
      throw new BadRequestException('Member not found');
    }

    const config = tontine.config;

    const loan = new Loan();
    loan.amount = amount;
    loan.currency = currency;
    loan.author = author;
    loan.createdAt = new Date();
    loan.status = StatusLoan.PENDING;
    loan.redemptionDate = createLoanDto.redemptionDate;
    loan.interestRate = config.defaultLoanRate;
    loan.tontine = tontine;
    this.dataSource.getRepository(Loan).save(loan);
  }

  async findAll(tontineId: number): Promise<Loan[]> {
    const tontine = await this.dataSource
      .getRepository(Tontine)
      .findOne({ where: { id: tontineId } });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }
    return this.dataSource.getRepository(Loan).find({
      where: { tontine: { id: tontineId } },
      relations: ['author', 'author.user'],
    });
  }

  async findOne(id: number): Promise<Loan> {
    const loan = await this.dataSource
      .getRepository(Loan)
      .findOne({ where: { id } });
    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    return loan;
  }

  async update(id: number, updateLoanDto: UpdateLoanDto): Promise<void> {
    const { amount, status, currency, voters } = updateLoanDto;
    const loan = await this.findOne(id);
    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    if (amount) {
      loan.amount = amount;
    }
    if (status) {
      loan.status = status;
    }
    if (currency) {
      loan.currency = currency;
    }
    if (voters && voters.length > 0) {
      const votersId = voters
        .filter(async (v) => {
          return !!(await this.dataSource
            .getRepository(Member)
            .findOne({ where: { id: v.id } }));
        })
        .map((v) => v.id);

      const cleanVoters = Array.from(new Set(votersId));
      loan.voters = cleanVoters;
    }

    this.dataSource.getRepository(Loan).save(loan);
  }

  async remove(id: number, user: User) {
    const loan = await this.findOne(id);
    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    if (
      !user.roles.includes(Role.PRESIDENT) &&
      !user.roles.includes(Role.ACCOUNT_MANAGER) &&
      loan.author.user.username !== user.username
    ) {
      throw new BadRequestException('You are not the author of this loan');
    }

    return this.dataSource.getRepository(Loan).delete(id);
  }

  async vote(id: number, user: Member) {
    const loan = await this.findOne(id);
    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    if (loan.voters.includes(user.id)) {
      throw new BadRequestException('You already voted');
    }

    loan.voters.push(user.id);
    this.dataSource.getRepository(Loan).save(loan);
  }
}
