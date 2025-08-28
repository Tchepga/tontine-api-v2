import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { LoginDto } from 'src/authentification/dto/login-dto';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { DataSource } from 'typeorm';
import {
  CreateMemberDto,
  createToMemberDtoToMember,
} from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';
import { environment } from 'src/shared/environement';

@Injectable()
export class MemberService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authentificationService: AuthentificationService,
  ) {}

  async create(createMemberDto: CreateMemberDto) {
    const member = createToMemberDtoToMember(createMemberDto);

    this.validatePassword(createMemberDto);

    if (createMemberDto.username) {
      const user = await this.authentificationService.findByUsername(
        createMemberDto.username,
      );
      if (user) {
        throw new BadRequestException('Username already used');
      }
    } else {
      createMemberDto.username =
        createMemberDto.firstname + '.' + createMemberDto.lastname;
    }
    const loginDto = {
      username: createMemberDto.username,
      password: createMemberDto.password,
      role: createMemberDto?.roles ?? Role.TONTINARD,
    } as LoginDto;

    const user = await this.authentificationService.register(loginDto);
    member.user = user;

    return await this.dataSource.getRepository(Member).save(member);
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
