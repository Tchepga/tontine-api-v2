import { IsString, MinLength } from 'class-validator';
import { environment } from 'src/shared/config';

export class ResetPasswordDto {
  @IsString({ message: 'Le token de réinitialisation est requis' })
  token: string;

  @IsString({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(environment.passwordConfig.minLength, {
    message: `Le mot de passe doit contenir au moins ${environment.passwordConfig.minLength} caractères`,
  })
  newPassword: string;
}
