import { IsString, Length } from 'class-validator';
import { Member } from '../entities/member.entity';
import { User } from '../../authentification/entities/user.entity';
import { Role } from '../../authentification/entities/roles/roles.enum';
import { environment } from 'src/shared/config';

export class CreateMemberDto {
  username: string;

  password?: string | undefined;

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

  // The roles field is optional
  roles?: Role[];
}

export function createToMemberDtoToMember(
  createMemberDto: CreateMemberDto,
): Member {
  const { username, password, firstname, lastname, email, phone, country } =
    createMemberDto;
  const member = new Member();
  const user = new User();
  user.username = username;
  if (!password) {
    user.password = environment.passwordConfig.defaultPassword;
  } else {
    user.password = password;
  }

  member.user = user;
  member.firstname = firstname;
  member.lastname = lastname;
  member.email = email;
  member.phone = phone;
  member.country = country;
  return member;
}
