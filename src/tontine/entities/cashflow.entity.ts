import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Deposit } from './deposit.entity';

@Entity()
export class CashFlow {
  @PrimaryGeneratedColumn()
  id: number;

  /** Solde du pot de rotation (cotisations COTISATION validées) */
  @Column()
  amount: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column()
  dividendes: number;

  /** Solde du fond de la tontine (cotisations FOND validées — réserve commune) */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fondBalance: number;

  @OneToMany(() => Deposit, (deposit) => deposit.cashFlow)
  deposits: Deposit[];
}
