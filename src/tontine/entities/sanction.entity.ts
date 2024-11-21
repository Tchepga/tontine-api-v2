import { Member } from 'src/member/entities/member.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tontine } from './tontine.entity';

@Entity()
export class Sanction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @ManyToMany(() => Member, (member) => member.sanctions)
  @JoinColumn()
  gulty: Member;

  @ManyToOne(() => Tontine, (tontine) => tontine.sanctions)
  tontine: Tontine;
}
