import { IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString({ message: "Le nom d'utilisateur est requis" })
  username: string;
}
