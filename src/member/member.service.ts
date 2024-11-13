import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { Repository } from 'typeorm';
import {
  CreateMemberDto,
  createToMemberDtoToMember,
} from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member) private memberRepository: Repository<Member>,
    private readonly authentificationService: AuthentificationService,
  ) {}

  async create(createMemberDto: CreateMemberDto) {
    const member = createToMemberDtoToMember(createMemberDto);
    await this.authentificationService.register(member.user);
    return await this.memberRepository.save(member);
  }

  findAll() {
    return this.memberRepository.find();
  }

  findOne(id: number) {
    return this.memberRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<Member | null> {
    const user = await this.authentificationService.findByUsername(username);
    return this.memberRepository
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.user', 'user', 'user.username = :username', {
        username: user.username,
      })
      .getOne();
  }

  update(id: number, updateMemberDto: UpdateMemberDto) {
    return `This action updates a #${id} member`;
  }

  remove(id: number) {
    return `This action removes a #${id} member`;
  }
}
