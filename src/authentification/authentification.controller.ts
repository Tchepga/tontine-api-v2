import { Body, Controller, Post } from '@nestjs/common';
import { AuthentificationService } from './authentification.service';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthentificationController {
  constructor(
    private authService: AuthentificationService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() loginDto: LoginDto): any {
    return this.authService.register(loginDto);
  }

  // @Post('logout')
  // logout() {
  //   this.jwtService.
  // }

  // @Post('reset-password')
  // resetPassword() {
  //   return this.
  // }
}
