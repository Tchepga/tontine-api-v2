import { Member } from '../../member/entities/member.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TypeNotification } from '../enum/type-notification';
import { Tontine } from '../../tontine/entities/tontine.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  type: TypeNotification;

  @Column()
  createdAt: Date;

  @Column()
  isRead: boolean;

  @ManyToOne(() => Member, (member) => member.notifications)
  target: Member;

  @ManyToOne(() => Tontine, (tontine) => tontine.notifications)
  tontine: Tontine;
}
