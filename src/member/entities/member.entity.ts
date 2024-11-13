import { User } from 'src/authentification/entities/user.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn()
  user: User;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  country: string;

  @ManyToMany(() => Tontine, (tontine) => tontine.members)
  tontines: Tontine[];
}
