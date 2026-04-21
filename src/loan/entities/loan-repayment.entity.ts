import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Loan } from './loan.entity';
import { Member } from '../../member/entities/member.entity';

/**
 * Enregistre chaque remboursement partiel ou total d'un prêt.
 * Les intérêts collectés sont reversés dans dividendes du cashflow.
 */
@Entity({ name: 'loan_repayment' })
export class LoanRepayment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Loan, (loan) => loan.repayments, { onDelete: 'CASCADE' })
  @JoinColumn()
  loan: Loan;

  /** Montant total versé lors de ce remboursement */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  /** Part imputée au capital */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  principalAmount: number;

  /** Part des intérêts — ajoutée aux dividendes du cashflow */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  interestAmount: number;

  @Column({ default: 'FCFA' })
  currency: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paidAt: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  /** Membre qui a enregistré le remboursement */
  @ManyToOne(() => Member, { eager: true, nullable: true })
  @JoinColumn()
  recordedBy: Member;
}
