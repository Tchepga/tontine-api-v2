import { Member } from 'src/member/entities/member.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
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

  @ManyToMany(() => Member, (member) => member.tontines, { cascade: true })
  @JoinTable()
  members: Member[];

  @OneToOne(() => ConfigTontine)
  @JoinColumn()
  config: ConfigTontine;

  @OneToOne(() => CashFlow)
  @JoinColumn()
  cashFlow: CashFlow;
}
