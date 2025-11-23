import { BadRequestException, Injectable } from '@nestjs/common';
import { Member } from '../member/entities/member.entity';
import { Tontine } from '../tontine/entities/tontine.entity';
import { DataSource } from 'typeorm';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { StatusLoan } from './enum/status-loan';
import { Role } from '../authentification/entities/roles/roles.enum';
import { User } from '../authentification/entities/user.entity';
import { Action } from '../notification/utility/message-notification';
import { NotificationService } from '../notification/notification.service';
import { TypeNotification } from '../notification/enum/type-notification';

@Injectable()
export class LoanService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

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

    this.validateLoan(createLoanDto, config);

    const loan = new Loan();
    loan.amount = amount;
    loan.currency = currency;
    loan.author = author;
    loan.createdAt = new Date();
    loan.status = StatusLoan.PENDING;
    loan.redemptionDate = createLoanDto.redemptionDate;
    loan.interestRate = config.defaultLoanRate;
    loan.tontine = tontine;
    const loanSaved = await this.dataSource.getRepository(Loan).save(loan);

    this.notificationService.create(
      {
        action: Action.CREATE,
        loanId: loanSaved.id,
        type: TypeNotification.LOAN,
        tontineId: tontine.id,
      },
      user,
    );

    return loanSaved;
  }

  async findAll(tontineId: number, user: User): Promise<Loan[]> {
    const tontine = await this.dataSource.getRepository(Tontine).findOne({
      where: { id: tontineId },
      relations: ['members', 'members.user'],
    });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }
    if (
      tontine.members.some((member) => member.user.username === user.username)
    ) {
      return this.dataSource.getRepository(Loan).find({
        where: { tontine: { id: tontineId } },
        relations: ['members'],
        order: { createdAt: 'DESC' },
      });
    } else {
      throw new BadRequestException('You are not a member of this tontine');
    }
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

  async vote(id: number, user: User) {
    const loan = await this.findOne(id);
    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    const member = await this.dataSource.getRepository(Member).findOne({
      where: { user: { username: user.username } },
    });

    if (!member) {
      throw new BadRequestException('Member not found');
    }

    if (loan.voters?.includes(member.id)) {
      throw new BadRequestException('You already voted');
    }
    if (!loan.voters) {
      loan.voters = [];
    }
    loan.voters.push(member.id);
    this.dataSource.getRepository(Loan).save(loan);
  }

  private validateLoan(createLoanDto: CreateLoanDto, config: any) {
    if (createLoanDto.amount > config?.maxLoanAmount) {
      throw new BadRequestException('Amount is too high');
    }
    if (createLoanDto.amount < config?.minLoanAmount) {
      throw new BadRequestException('Amount is too low');
    }
    if (createLoanDto.redemptionDate < new Date()) {
      throw new BadRequestException('Redemption date is in the past');
    }
  }
}
