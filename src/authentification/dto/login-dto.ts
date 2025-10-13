import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { Role } from '../entities/roles/roles.enum';

export class LoginDto {
  @ApiProperty({
    description: "Nom d'utilisateur",
    example: 'john_doe',
  })
  @IsString({ message: "Le nom d'utilisateur est requis" })
  username: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'motdepasse123',
  })
  @IsString({ message: 'Le mot de passe est requis' })
  password: string;

  @ApiProperty({
    description: "Rôle de l'utilisateur",
    enum: Role,
    example: Role.TONTINARD,
    required: false,
  })
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
