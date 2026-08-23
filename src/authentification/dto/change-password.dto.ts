import { IsString, MinLength } from 'class-validator';
import { environment } from 'src/shared/config';

export class ChangePasswordDto {
  @IsString({ message: 'Le mot de passe actuel est requis' })
  currentPassword: string;

  @IsString({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(environment.passwordConfig.minLength, {
    message: `Le mot de passe doit contenir au moins ${environment.passwordConfig.minLength} caractères`,
  })
  newPassword: string;
}
