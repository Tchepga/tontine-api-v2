import { User } from 'src/authentification/entities/user.entity';
import { Event } from 'src/event/entities/event.entity';
import { Loan } from 'src/loan/entities/loan.entity';
import { BasicEntity } from 'src/shared/utilities/basic.entity';
import { Deposit } from 'src/tontine/entities/deposit.entity';
import { RapportMeeting } from 'src/tontine/entities/rapport-meeting.entity';
import { Sanction } from 'src/tontine/entities/sanction.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';
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

  @Column({ nullable: true })
  @OneToMany(() => Loan, (loan) => loan.author)
  loans: string;

  @OneToMany(() => Event, (event) => event.tontine)
  events: Event[];

  @OneToMany(() => RapportMeeting, (rapport) => rapport.author)
  rapport: RapportMeeting[];

  @ManyToMany(() => Sanction, (sanction) => sanction.gulty)
  sanctions: Sanction[];

  @OneToMany(() => Deposit, (deposit) => deposit.author)
  deposits: Deposit[];
}
