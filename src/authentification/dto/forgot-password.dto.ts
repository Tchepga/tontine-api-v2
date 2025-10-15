import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur ou email',
    example: 'john_doe',
  })
  @IsString()
  usernameOrEmail: string;
}
