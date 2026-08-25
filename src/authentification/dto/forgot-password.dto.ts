import { IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString({ message: "Le nom d'utilisateur ou l'email est requis" })
  usernameOrEmail: string;
}
