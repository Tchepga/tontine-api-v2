import { Member } from 'src/member/entities/member.entity';
import { PrimaryGeneratedColumn, Column, ManyToOne, Entity } from 'typeorm';
import { Tontine } from './tontine.entity';

@Entity()
export class RapportMeeting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @ManyToOne(() => Member, (member) => member.rapport)
  author: Member;

  @ManyToOne(() => Tontine, (tontine) => tontine.rapports)
  tontine: Tontine;

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt: Date;
}
