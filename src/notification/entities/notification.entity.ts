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

  // Clé de déduplication (ex: missing-deposit:12:2025-12:45)
  // Permet d'éviter d'envoyer plusieurs fois le même rappel.
  @Column({ nullable: true, unique: true })
  dedupKey?: string;

  @ManyToOne(() => Member, (member) => member.notifications)
  target: Member;

  @ManyToOne(() => Tontine, (tontine) => tontine.notifications)
  tontine: Tontine;
}
