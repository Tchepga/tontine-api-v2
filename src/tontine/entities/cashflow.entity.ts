import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Deposit } from './deposit.entity';

@Entity()
export class CashFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column()
  dividendes: number;

  @OneToMany(() => Deposit, (deposit) => deposit.cashFlow)
  deposits: Deposit[];
}
