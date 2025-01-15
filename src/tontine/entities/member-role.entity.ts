import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Tontine } from './tontine.entity';
import { User } from '../../authentification/entities/user.entity';
import { Role } from '../../authentification/entities/roles/roles.enum';

@Entity()
export class MemberRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Tontine)
  tontine: Tontine;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.TONTINARD,
  })
  role: Role;
}
