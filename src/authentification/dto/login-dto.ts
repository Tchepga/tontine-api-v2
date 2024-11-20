// src/auth/dto/login.dto.ts
import { IsIn, IsString } from 'class-validator';
import { User } from '../entities/user.entity';
import { Role } from '../entities/roles/roles.enum';

export class LoginDto {
  @IsString({ message: "Le nom d'utilisateur est requis" })
  username: string;

  @IsString({ message: 'Le mot de passe est requis' })
  password: string;

  @IsIn([...Object.values(Role), undefined, null], {
    message: 'Le rôle est invalide',
  })
  role?: Role | undefined | null;

  public toUser(): User {
    const { username, password } = this;
    const user = new User();
    user.username = username;
    user.password = password;

    return user;
  }
}
