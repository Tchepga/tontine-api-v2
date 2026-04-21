import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de réinitialisation',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'nouveauMotDePasse123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  newPassword: string;
}
