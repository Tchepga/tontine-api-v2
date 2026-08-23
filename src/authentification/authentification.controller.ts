import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthentificationService } from './authentification.service';
import { LoginDto } from './dto/login-dto';
import { Public } from './entities/public.decorator';
import { Role } from './entities/roles/roles.enum';
import { Roles } from './entities/roles/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const loginThrottle =
  process.env.NODE_ENV === 'production'
    ? { default: { limit: 5, ttl: 60_000 } }
    : { default: { limit: 10_000, ttl: 60_000 } };

@Controller('auth')
export class AuthentificationController {
  constructor(private authService: AuthentificationService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(loginThrottle)
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

  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.username, dto);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.username);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('username/:username')
  @Roles(Role.PRESIDENT)
  async getUsername(@Param('username') username: string) {
    return this.authService.getUserByUsername(username);
  }
}
