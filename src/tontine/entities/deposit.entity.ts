import { Member } from 'src/member/entities/member.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StatusDeposit } from '../enum/status-deposit';
import { CashFlow } from './cashflow.entity';

@Entity()
export class Deposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @ManyToOne(() => Member, (member) => member.deposits)
  author: Member;

  @Column({ default: 'FCFA' })
  currency: string;

  @Column()
  status: StatusDeposit;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creationDate: Date;

  @Column({ nullable: true })
  reasons: string;

  @ManyToOne(() => CashFlow, (cashFlow) => cashFlow.deposits)
  cashFlow: CashFlow;
}
