import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Member } from '../member/entities/member.entity';
import { Tontine } from '../tontine/entities/tontine.entity';
import { DataSource } from 'typeorm';
import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateLoanRepaymentDto } from './dto/create-loan-repayment.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { LoanRepayment } from './entities/loan-repayment.entity';
import { CashFlow } from '../tontine/entities/cashflow.entity';
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
        relations: ['author', 'author.user'],
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

  private validateLoan(createLoanDto: CreateLoanDto, config: any) {
    if (config?.maxLoanAmount && createLoanDto.amount > config.maxLoanAmount) {
      throw new BadRequestException('Amount is too high');
    }
    if (config?.minLoanAmount && createLoanDto.amount < config.minLoanAmount) {
      throw new BadRequestException('Amount is too low');
    }
    if (createLoanDto.redemptionDate < new Date()) {
      throw new BadRequestException('Redemption date is in the past');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Approbation / rejet
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Le président peut approuver directement un prêt (sans vote).
   */
  async approveLoan(id: number, user: User): Promise<Loan> {
    const loan = await this.dataSource.getRepository(Loan).findOne({
      where: { id },
      relations: ['author', 'author.user', 'tontine'],
    });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== StatusLoan.PENDING) {
      throw new BadRequestException('Only pending loans can be approved');
    }
    loan.status = StatusLoan.APPROVED;
    const saved = await this.dataSource.getRepository(Loan).save(loan);
    this.notificationService.create(
      {
        action: Action.UPDATE,
        loanId: saved.id,
        type: TypeNotification.LOAN,
        tontineId: loan.tontine.id,
      },
      user,
    );
    return saved;
  }

  /**
   * Le président peut rejeter un prêt avec une raison.
   */
  async rejectLoan(
    id: number,
    reason: string,
    user: User,
  ): Promise<Loan> {
    const loan = await this.dataSource.getRepository(Loan).findOne({
      where: { id },
      relations: ['author', 'author.user', 'tontine'],
    });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== StatusLoan.PENDING) {
      throw new BadRequestException('Only pending loans can be rejected');
    }
    loan.status = StatusLoan.REJECTED;
    loan.rejectionReason = reason;
    const saved = await this.dataSource.getRepository(Loan).save(loan);
    this.notificationService.create(
      {
        action: Action.UPDATE,
        loanId: saved.id,
        type: TypeNotification.LOAN,
        tontineId: loan.tontine.id,
      },
      user,
    );
    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Vote avec approbation automatique selon seuil
  // ─────────────────────────────────────────────────────────────────────────────

  async vote(id: number, user: User) {
    const loan = await this.dataSource.getRepository(Loan).findOne({
      where: { id },
      relations: ['tontine', 'tontine.config', 'tontine.members'],
    });
    if (!loan) throw new BadRequestException('Loan not found');

    const member = await this.dataSource.getRepository(Member).findOne({
      where: { user: { username: user.username } },
    });
    if (!member) throw new BadRequestException('Member not found');

    if (loan.voters?.includes(member.id)) {
      throw new BadRequestException('You already voted');
    }
    if (!loan.voters) loan.voters = [];
    loan.voters.push(member.id);

    // Vérifier si le seuil d'approbation est atteint
    const threshold = loan.tontine.config?.loanApprovalThreshold ?? 51;
    const totalMembers = loan.tontine.members.length;
    const votePercent = (loan.voters.length / totalMembers) * 100;

    if (threshold > 0 && votePercent >= threshold) {
      loan.status = StatusLoan.APPROVED;
    }

    await this.dataSource.getRepository(Loan).save(loan);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Suivi des remboursements
  // ─────────────────────────────────────────────────────────────────────────────

  async getRepayments(loanId: number): Promise<LoanRepayment[]> {
    return this.dataSource.getRepository(LoanRepayment).find({
      where: { loan: { id: loanId } },
      relations: ['recordedBy', 'recordedBy.user'],
      order: { paidAt: 'DESC' },
    });
  }

  /**
   * Enregistre un remboursement, met à jour le statut du prêt (PAID si soldé)
   * et crédite les intérêts dans dividendes du cashflow.
   */
  async recordRepayment(
    loanId: number,
    dto: CreateLoanRepaymentDto,
    user: User,
  ): Promise<LoanRepayment> {
    const loan = await this.dataSource.getRepository(Loan).findOne({
      where: { id: loanId },
      relations: ['tontine', 'tontine.cashFlow', 'repayments', 'author', 'author.user'],
    });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status !== StatusLoan.APPROVED) {
      throw new BadRequestException(
        'Only approved loans can have repayments recorded',
      );
    }

    const recorder = await this.dataSource.getRepository(Member).findOne({
      where: { user: { username: user.username } },
    });

    const repayment = new LoanRepayment();
    repayment.loan = loan;
    repayment.amount = dto.amount;
    repayment.principalAmount = dto.principalAmount;
    repayment.interestAmount = dto.interestAmount;
    repayment.currency = dto.currency ?? loan.currency;
    repayment.notes = dto.notes;
    repayment.recordedBy = recorder;

    const saved = await this.dataSource
      .getRepository(LoanRepayment)
      .save(repayment);

    // Créditer les intérêts dans dividendes du cashflow
    if (dto.interestAmount > 0 && loan.tontine?.cashFlow?.id) {
      const cashflow = await this.dataSource
        .getRepository(CashFlow)
        .findOne({ where: { id: loan.tontine.cashFlow.id } });
      if (cashflow) {
        cashflow.dividendes =
          Number(cashflow.dividendes) + Number(dto.interestAmount);
        await this.dataSource.getRepository(CashFlow).save(cashflow);
      }
    }

    // Vérifier si le prêt est soldé
    const allRepayments = await this.dataSource
      .getRepository(LoanRepayment)
      .find({ where: { loan: { id: loanId } } });
    const totalPrincipalRepaid = allRepayments.reduce(
      (acc, r) => acc + Number(r.principalAmount),
      0,
    );
    if (totalPrincipalRepaid >= Number(loan.amount)) {
      loan.status = StatusLoan.PAID;
      await this.dataSource.getRepository(Loan).save(loan);
    }

    return saved;
  }
}
