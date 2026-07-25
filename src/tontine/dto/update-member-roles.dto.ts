import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { Role } from 'src/authentification/entities/roles/roles.enum';

export class UpdateMemberRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles: Role[];
}
