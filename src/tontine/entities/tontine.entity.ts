import { Loan } from '../../loan/entities/loan.entity';
import { Member } from '../../member/entities/member.entity';
import { BasicEntity } from '../../shared/utilities/basic.entity';
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
import { Event } from '../../event/entities/event.entity';
import { RapportMeeting } from './rapport-meeting.entity';
import { Sanction } from './sanction.entity';
import { MemberRole } from './member-role.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { InvitationLink } from './invitation-link.entity';

@Entity()
export class Tontine extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  legacy: string;

  @ManyToMany(() => Member, (member) => member.tontines, { eager: true })
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

  @OneToMany(() => MemberRole, (memberRole) => memberRole.tontine)
  memberRoles: MemberRole[];

  @Column({ default: false })
  isSelected: boolean;

  @OneToMany(() => Notification, (notification) => notification.tontine)
  notifications: Notification[];

  @OneToMany(() => InvitationLink, (invitationLink) => invitationLink.tontine)
  invitationLinks: InvitationLink[];
}
