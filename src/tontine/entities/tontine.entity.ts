import { Member } from 'src/member/entities/member.entity';
import {
  Column,
  Entity,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConfigTontine } from './config-tontine.entity';
import { CashFlow } from './cashflow.entity';

@Entity()
export class Tontine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  legacy: string;

  @ManyToMany(() => Member)
  members: Member[];

  @OneToOne(() => ConfigTontine)
  config: ConfigTontine;

  @OneToOne(() => CashFlow)
  cashFlow: CashFlow;
}
