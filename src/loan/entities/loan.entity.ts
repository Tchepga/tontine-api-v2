// import { Member } from 'src/member/entities/member.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusLoan } from '../enum/status-loan';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { Member } from 'src/member/entities/member.entity';

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

  @ManyToOne(() => Tontine, (tontine) => tontine.loans)
  @JoinColumn()
  tontine: Tontine;

  @ManyToOne(() => Member, (member) => member.loans)
  @JoinColumn()
  author: Member;

  @Column('simple-array', { nullable: true })
  voters: number[];
}
