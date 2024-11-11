import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CashFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column()
  dividendes: number;
}
