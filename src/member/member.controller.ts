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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberService } from './member.service';
import { validateEmail } from '../shared/utilities/custom-validator';
import { RolesGuard } from '../authentification/entities/roles/roles.guard';
import { Roles } from '../authentification/entities/roles/roles.decorator';
import { Role } from '../authentification/entities/roles/roles.enum';
import { Public } from '../authentification/entities/public.decorator';

@ApiTags('Membre')
@ApiBearerAuth('JWT-auth')
@Controller('member')
@UseGuards(RolesGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @Roles(Role.PRESIDENT)
  @ApiOperation({
    summary: 'Créer un nouveau membre',
    description:
      'Crée un nouveau membre dans le système (réservé aux présidents)',
  })
  @ApiResponse({
    status: 201,
    description: 'Membre créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Rôle président requis',
  })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.validateAndCreate(createMemberDto);
  }

  @Post('/register-president')
  @Public()
  @ApiOperation({
    summary: "Inscription d'un président",
    description: "Permet l'inscription d'un président sans authentification",
  })
  @ApiResponse({
    status: 201,
    description: 'Président créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  registerPresident(@Body() createMemberDto: CreateMemberDto) {
    createMemberDto.roles = [Role.PRESIDENT];
    return this.validateAndCreate(createMemberDto);
  }

  @Get()
  @Roles(Role.TONTINARD)
  @ApiOperation({
    summary: 'Récupérer le profil du membre connecté',
    description: 'Récupère les informations du membre actuellement connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil du membre récupéré',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
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
