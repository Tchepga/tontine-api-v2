import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';

const mockMembers: Member[] = [
  {
    id: 1,
    username: 'john_doe',
    email: 'test@email.fr',
    firstname: 'John',
    lastname: 'Doe',
    phone: '0606060606',
    country: 'France',
    password: 'password',
  },
  {
    id: 2,
    username: 'paul_smith',
    email: 'paul.smith@email.fr',
    firstname: 'Paul',
    lastname: 'Smith',
    phone: '0606060606',
    country: 'France',
    password: 'password',
  },
];

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  create(createMemberDto: CreateMemberDto) {
    return this.memberRepository.save(createMemberDto);
  }

  findAll() {
    return this.memberRepository.find();
  }

  findOne(id: number) {
    return this.memberRepository.findOne({ where: { id } });
  }

  findByUsername(username: string) {
    return mockMembers.find((member) => member.username === username);
  }

  update(id: number, updateMemberDto: UpdateMemberDto) {
    return `This action updates a #${id} member`;
  }

  remove(id: number) {
    return `This action removes a #${id} member`;
  }
}
