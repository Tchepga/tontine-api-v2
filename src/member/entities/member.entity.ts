import { User } from '../../authentification/entities/user.entity';
import { Event } from '../../event/entities/event.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { BasicEntity } from '../../shared/utilities/basic.entity';
import { Deposit } from '../../tontine/entities/deposit.entity';
import { RapportMeeting } from '../../tontine/entities/rapport-meeting.entity';
import { Sanction } from '../../tontine/entities/sanction.entity';
import { Tontine } from '../../tontine/entities/tontine.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Member extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  phone: string;

  @Column()
  country: string;

  @ManyToMany(() => Tontine, (tontine) => tontine.members)
  tontines: Tontine[];

  @OneToMany(() => Loan, (loan) => loan.author)
  loans: Loan[];

  @OneToMany(() => Event, (event) => event.tontine)
  events: Event[];

  @OneToMany(() => RapportMeeting, (rapport) => rapport.author)
  rapport: RapportMeeting[];

  @ManyToMany(() => Sanction, (sanction) => sanction.gulty)
  sanctions: Sanction[];

  @OneToMany(() => Deposit, (deposit) => deposit.author)
  deposits: Deposit[];

  @OneToMany(() => Notification, (notification) => notification.target)
  notifications: Notification[];
}
