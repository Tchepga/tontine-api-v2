import { IsString, Length } from 'class-validator';

export class CreateMemberDto {
  @IsString({ message: "Le nom d'utilisateur est requis" })
  @Length(4, 20, {
    message: "Le nom d'utilisateur doit avoir entre 4 et 20 caractères",
  })
  username: string;

  @IsString({ message: 'Le mot de passe est requis' })
  @Length(8, 100, {
    message: 'Le mot de passe doit avoir entre 8 et 20 caractères',
  })
  password: string;

  @IsString({ message: 'Le prénom est requis' })
  firstname: string;

  @IsString({ message: 'Le nom est requis' })
  lastname: string;

  // The email field is optional
  email?: string;

  @IsString({ message: 'Le numéro de téléphone est requis' })
  phone: string;

  @IsString({ message: 'Le pays est requis' })
  @Length(2, 2, { message: 'Le pays doit avoir exactement 2 caractères' })
  country: string;
}
