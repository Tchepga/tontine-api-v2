import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationLinkDto {
  @ApiProperty({
    description: "Nom d'utilisateur du membre à inviter",
    example: 'jean_dupont',
  })
  @IsString({ message: "Le nom d'utilisateur est requis" })
  @MinLength(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères",
  })
  username: string;
}
