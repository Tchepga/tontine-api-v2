import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { LoginDto } from 'src/authentification/dto/login-dto';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { MailService } from 'src/mail/mail.service';
import { DataSource } from 'typeorm';
import {
  CreateMemberDto,
  createToMemberDtoToMember,
} from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';
import { environment } from 'src/shared/environement';
import { validateEmail } from 'src/shared/utilities/custom-validator';
import {
  buildUsername,
  generateUniqueUsername,
} from 'src/shared/utilities/username-generator';

@Injectable()
export class MemberService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authentificationService: AuthentificationService,
    private readonly mailService: MailService,
  ) {}

  async create(createMemberDto: CreateMemberDto) {
    this.sanitizeCreateMemberDto(createMemberDto);

    if (!createMemberDto.firstname || !createMemberDto.lastname) {
      throw new BadRequestException('Le prénom et le nom sont requis');
    }

    const member = createToMemberDtoToMember(createMemberDto);

    this.validatePassword(createMemberDto);

    const username = await generateUniqueUsername(
      createMemberDto.firstname,
      createMemberDto.lastname,
      async (candidate) => {
        const user = await this.authentificationService.findByUsername(
          candidate,
        );
        return !!user;
      },
    );
    const loginDto = {
      username,
      password: createMemberDto.password,
      role: createMemberDto?.roles?.[0] ?? Role.TONTINARD,
    } as LoginDto;

    const user = await this.authentificationService.register(loginDto);
    member.user = user;

    const saved = await this.dataSource.getRepository(Member).save(member);

    const isPresident = createMemberDto.roles?.includes(Role.PRESIDENT) ?? false;
    let emailSent = false;
    if (
      isPresident &&
      createMemberDto.email &&
      validateEmail(createMemberDto.email)
    ) {
      emailSent = await this.mailService.sendRegistrationWelcomeEmail({
        to: createMemberDto.email,
        firstname: createMemberDto.firstname,
        lastname: createMemberDto.lastname,
        username,
      });
    }

    return Object.assign(saved, { emailSent, username });
  }

  findAll() {
    return this.dataSource.getRepository(Member).find();
  }

  async findOne(id: number) {
    const member = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { id } });
    if (member) {
      return member;
    } else {
      throw new NotFoundException(`Member with id ${id} not found`);
    }
  }

  buildUsernameForMember(firstname: string, lastname: string): string {
    return buildUsername(firstname, lastname);
  }

  async findByUsername(username: string): Promise<Member | null> {
    const user = await this.authentificationService.findByUsername(username);
    if (!user) {
      return null;
    }
    return this.dataSource
      .getRepository(Member)
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.user', 'user', 'user.username = :username', {
        username: user.username,
      })
      .getOne();
  }

  async update(id: number, updateMemberDto: UpdateMemberDto) {
    const member = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { id } });
    const { firstname, lastname, email, phone } = updateMemberDto;
    if (member) {
      member.firstname = firstname ?? member.firstname;
      member.lastname = lastname ?? member.lastname;
      member.email = email ?? member.email;
      member.phone = phone ?? member.phone;
      return this.dataSource.getRepository(Member).save(member);
    } else {
      throw new NotFoundException(`Member with id ${id} not found`);
    }
  }

  async remove(id: number): Promise<void> {
    const member = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { id } });
    if (member) {
      member.isActive = false;
      this.dataSource.getRepository(Member).save(member);
    } else {
      throw new NotFoundException(`Member with id ${id} not found`);
    }
  }

  private sanitizeCreateMemberDto(createMemberDto: CreateMemberDto): void {
    createMemberDto.firstname = createMemberDto.firstname?.trim() ?? '';
    createMemberDto.lastname = createMemberDto.lastname?.trim() ?? '';
    if (createMemberDto.email) {
      createMemberDto.email = createMemberDto.email.trim();
    }
    if (createMemberDto.phone) {
      createMemberDto.phone = createMemberDto.phone.trim();
    }
  }

  private validatePassword(createMemberDto: CreateMemberDto) {
    if (!createMemberDto.password) {
      createMemberDto.password = environment.passwordConfig.defaultPassword;
    }
    const { minLength, maxLength } = environment.passwordConfig;
    if (createMemberDto.password.length < minLength) {
      throw new BadRequestException(
        `Password must be at least ${minLength} characters long`,
      );
    }
    if (createMemberDto.password.length > maxLength) {
      throw new BadRequestException(
        `Password must be less than ${maxLength} characters long`,
      );
    }
  }
}
