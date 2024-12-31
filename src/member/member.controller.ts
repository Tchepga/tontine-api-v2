import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberService } from './member.service';
import { validateEmail } from 'src/shared/utilities/custom-validator';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { Public } from 'src/authentification/entities/public.decorator';

@Controller('member')
@UseGuards(RolesGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  @Post()
  @Roles(Role.PRESIDENT)
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.validateAndCreate(createMemberDto);
  }

  @Post('/register-president')
  @Public()
  registerPresident(@Body() createMemberDto: CreateMemberDto) {
    createMemberDto.roles = [Role.PRESIDENT];
    return this.validateAndCreate(createMemberDto);
  }

  @Get()
  @Roles(Role.TONTINARD)
  findOne(@Req() req: any) {
    const { user } = req;
    if (!user) {
      throw new UnauthorizedException('Need to be logged in');
    }
    return this.memberService.findByUsername(user.username);
  }

  @Patch(':id')
  @Roles(Role.TONTINARD)
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.memberService.update(+id, updateMemberDto);
  }

  @Delete(':id')
  @Roles(Role.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.memberService.remove(+id);
  }

  @Get('/username/:username')
  @Roles(Role.PRESIDENT)
  findByUsername(@Param('username') username: string) {
    return this.memberService.findByUsername(username);
  }

  private validateAndCreate(createMemberDto: CreateMemberDto) {
    if (createMemberDto.email) {
      validateEmail(createMemberDto.email);
    }
    return this.memberService.create(createMemberDto);
  }
}
