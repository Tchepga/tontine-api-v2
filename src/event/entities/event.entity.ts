import {
  Column,
  Entity,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventType } from '../enum/event-type';
import { Member } from '../../member/entities/member.entity';
import { Tontine } from '../../tontine/entities/tontine.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  type: EventType;

  @Column()
  description: string;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @ManyToMany(() => Member)
  @JoinTable()
  participants: Member[];

  @ManyToOne(() => Member, (member) => member.events)
  author: Member;

  @ManyToOne(() => Tontine, (tontine) => tontine.events)
  tontine: Tontine;
}
