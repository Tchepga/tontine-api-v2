// src/auth/dto/login.dto.ts
import { IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class LoginDto {
  @IsString({ message: "Le nom d'utilisateur est requis" })
  username: string;

  @IsString({ message: 'Le mot de passe est requis' })
  password: string;

  public toUser(): User {
    const { username, password } = this;
    const user = new User();
    user.username = username;
    user.password = password;

    return user;
  }
}
