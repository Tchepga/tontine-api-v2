import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tontine } from './tontine.entity';
import { User } from '../../authentification/entities/user.entity';
import { Role } from '../../authentification/entities/roles/roles.enum';

@Entity()
export class MemberRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userUsername', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Tontine)
  tontine: Tontine;

  /**
   * varchar plutôt qu'enum MySQL : TypeORM ne met pas à jour l'ENUM
   * (ex. VICE_PRESIDENT / OFFICE_MANAGER) quand synchronize=false.
   */
  @Column({
    type: 'varchar',
    length: 50,
    default: Role.TONTINARD,
  })
  role: Role;
}
