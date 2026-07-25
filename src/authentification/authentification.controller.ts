import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthentificationService } from './authentification.service';
import { LoginDto } from './dto/login-dto';
import { Public } from './entities/public.decorator';
import { Role } from './entities/roles/roles.enum';
import { Roles } from './entities/roles/roles.decorator';

@Controller('auth')
export class AuthentificationController {
  constructor(private authService: AuthentificationService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  /**
   * Inscription publique : rôle forcé à TONTINARD.
   * Pour créer un président, utiliser POST /member/register-president.
   */
  @Public()
  @Post('register')
  register(@Body() loginDto: LoginDto): any {
    loginDto.role = Role.TONTINARD;
    return this.authService.register(loginDto);
  }

  @Public()
  @Post('verify')
  async verify(@Body() body: { token: string }) {
    return { valid: await this.authService.verify(body.token) };
  }

  @Get('username/:username')
  @Roles(Role.PRESIDENT)
  async getUsername(@Param('username') username: string) {
    return this.authService.getUserByUsername(username);
  }
}
