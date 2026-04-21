import { Member } from '../../member/entities/member.entity';
import { Tontine } from './tontine.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum InvitationStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@Entity()
export class InvitationLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @ManyToOne(() => Tontine)
  tontine: Tontine;

  @ManyToOne(() => Member)
  createdBy: Member;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.ACTIVE,
  })
  status: InvitationStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @ManyToOne(() => Member, { nullable: true })
  usedBy: Member;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
