import { Role } from 'src/authentification/entities/roles/roles.enum';
import { User } from 'src/authentification/entities/user.entity';
import { Loan } from 'src/loan/entities/loan.entity';
import { BasicEntity } from 'src/shared/utilities/basic.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { Event } from 'src/event/entities/event.entity';
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

  @Column('simple-array')
  roles: Role[] = [Role.TONTINARD];

  @Column({ nullable: true })
  @OneToMany(() => Loan, (loan) => loan.author)
  loans: string;

  @OneToMany(() => Event, (event) => event.tontine)
  events: Event[];
}
