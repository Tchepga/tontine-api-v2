import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Role } from './roles/roles.enum';

@Entity()
export class User {
  @PrimaryColumn()
  username: string;
  @Column({ select: false })
  password: string;

  @Column('simple-array')
  roles: Role[] = [Role.TONTINARD];
}
