import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthentificationService } from './authentification.service';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Authentification')
@Controller('auth')
export class AuthentificationController {
  constructor(
    private authService: AuthentificationService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur et retourne un token JWT'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion réussie',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: { type: 'object' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Identifiants invalides' 
  })
  login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'Inscription utilisateur',
    description: 'Crée un nouveau compte utilisateur'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Utilisateur créé avec succès' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides ou utilisateur déjà existant' 
  })
  register(@Body() loginDto: LoginDto): any {
    return this.authService.register(loginDto);
  }

  @Post('verify')
  @ApiOperation({ 
    summary: 'Vérifier un token',
    description: 'Vérifie la validité d\'un token JWT'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token vérifié',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true }
      }
    }
  })
  async verify(@Body() body: { token: string }) {
    return { valid: await this.authService.verify(body.token) };
  }

  @Get('username/:username')
  @ApiOperation({ 
    summary: 'Récupérer un utilisateur par nom d\'utilisateur',
    description: 'Récupère les informations d\'un utilisateur par son nom d\'utilisateur'
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Nom d\'utilisateur',
    example: 'john_doe'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Utilisateur trouvé' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  async getUsername(@Param('username') username: string) {
    return this.authService.getUserByUsername(username);
  }

  // @Post('reset-password')
  // resetPassword() {
  //   return this.
  // }
}
