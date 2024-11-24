import { IsString, MinLength } from 'class-validator';

export class CreateMeetingRapportDto {
  @IsString({ message: 'Le titre doit être une chaine de caractères' })
  @MinLength(2)
  title: string;

  @IsString({ message: 'Le contenu doit être une chaine de caractères' })
  @MinLength(10, { message: 'Le contenu doit avoir au moins 10 caractères' })
  content: string;
}
