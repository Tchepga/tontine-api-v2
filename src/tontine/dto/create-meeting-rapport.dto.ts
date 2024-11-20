import { IsDate, IsString, MinLength } from 'class-validator';

export class CreateMeetingRapportDto {
  @IsString({ message: 'Le titre doit être une chaine de caractères' })
  @MinLength(5)
  title: string;

  @IsString({ message: 'Le contenu doit être une chaine de caractères' })
  @MinLength(10, { message: 'Le contenu doit avoir au moins 10 caractères' })
  content: string;

  @IsDate({ message: 'La date doit être une date valide' })
  date?: Date;
}
