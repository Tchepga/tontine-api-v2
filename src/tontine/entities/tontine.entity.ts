import { Loan } from 'src/loan/entities/loan.entity';
import { Member } from 'src/member/entities/member.entity';
import { BasicEntity } from 'src/shared/utilities/basic.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CashFlow } from './cashflow.entity';
import { ConfigTontine } from './config-tontine.entity';
import { Event } from 'src/event/entities/event.entity';
import { RapportMeeting } from './rapport-meeting.entity';
import { Sanction } from './sanction.entity';

@Entity()
export class Tontine extends BasicEntity {
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

  @OneToMany(() => Loan, (loan) => loan.tontine)
  loans: Loan[];

  @OneToMany(() => Event, (event) => event.tontine)
  events: Event[];

  @OneToMany(() => RapportMeeting, (rapport) => rapport.tontine)
  rapports: RapportMeeting[];

  @OneToMany(() => Sanction, (sanction) => sanction.tontine)
  sanctions: Sanction[];
}
