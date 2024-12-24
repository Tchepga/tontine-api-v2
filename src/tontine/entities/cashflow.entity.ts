import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CashFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column({ default: 'EURO' })
  currency: string;

  @Column()
  dividendes: number;

  @OneToMany(() => CashFlow, (cashFlow) => cashFlow.deposits)
  deposits: CashFlow[];
}
