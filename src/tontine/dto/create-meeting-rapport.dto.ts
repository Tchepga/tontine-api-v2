import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateMeetingRapportDto {
  @IsString({ message: 'Le titre doit être une chaine de caractères' })
  @MinLength(2)
  title: string;

  @IsString({ message: 'Le contenu doit être une chaine de caractères' })
  content: string;

  @IsOptional()
  @IsString()
  attachmentFilename?: string;

  @IsOptional()
  @IsString()
  attachment?: string;
}
