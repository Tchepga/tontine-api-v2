import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: "Token d'invitation",
    example: 'abc123def456ghi789',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: "Nom d'utilisateur pour le compte",
    example: 'jean_dupont',
  })
  @IsString()
  @MinLength(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères",
  })
  username: string;

  @ApiProperty({
    description: 'Mot de passe pour le compte',
    example: 'motdepasse123',
  })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  password: string;

  @ApiProperty({
    description: 'Prénom (optionnel, peut être pré-rempli)',
    example: 'Jean',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Nom de famille (optionnel, peut être pré-rempli)',
    example: 'Dupont',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Numéro de téléphone (optionnel)',
    example: '+237 123 456 789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
