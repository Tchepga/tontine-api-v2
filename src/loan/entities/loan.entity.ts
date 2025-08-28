import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusLoan } from '../enum/status-loan';
import { Tontine } from '../../tontine/entities/tontine.entity';
import { Member } from '../../member/entities/member.entity';

@Entity()
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column()
  createdAt: Date;

  @Column()
  status: StatusLoan;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ nullable: true })
  redemptionDate: Date;

  @Column({ nullable: true })
  interestRate: number;

  @ManyToOne(() => Tontine, (tontine) => tontine.loans)
  @JoinColumn()
  tontine: Tontine;

  @ManyToOne(() => Member, (member) => member.loans)
  @JoinColumn()
  author: Member;

  @Column('simple-array', { nullable: true })
  voters: number[];
}
