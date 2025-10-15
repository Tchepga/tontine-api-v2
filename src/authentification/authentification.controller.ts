import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthentificationService } from './authentification.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login-dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
    description: 'Authentifie un utilisateur et retourne un token JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
  })
  login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Inscription utilisateur',
    description: 'Crée un nouveau compte utilisateur',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou utilisateur déjà existant',
  })
  register(@Body() loginDto: LoginDto): any {
    return this.authService.register(loginDto);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Vérifier un token',
    description: "Vérifie la validité d'un token JWT",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token vérifié',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
      },
    },
  })
  async verify(@Body() body: { token: string }) {
    return { valid: await this.authService.verify(body.token) };
  }

  @Get('username/:username')
  @ApiOperation({
    summary: "Récupérer un utilisateur par nom d'utilisateur",
    description:
      "Récupère les informations d'un utilisateur par son nom d'utilisateur (sans le mot de passe)",
  })
  @ApiParam({
    name: 'username',
    description: "Nom d'utilisateur à rechercher",
    example: 'john_doe',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur trouvé avec succès',
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          example: 'john_doe',
        },
        roles: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'TONTINARD',
              'PRESIDENT',
              'ACCOUNT_MANAGER',
              'OFFICE_MANAGER',
            ],
          },
          example: ['TONTINARD'],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  async getUserByUsername(@Param('username') username: string) {
    return this.authService.getUserByUsername(username);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Demander une réinitialisation de mot de passe',
    description:
      'Génère un token de réinitialisation pour un utilisateur. En production, un email serait envoyé.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token de réinitialisation généré',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Token de réinitialisation généré. En production, un email serait envoyé.',
        },
        resetToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Réinitialiser le mot de passe',
    description:
      "Réinitialise le mot de passe d'un utilisateur avec un token valide",
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mot de passe réinitialisé avec succès',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalide ou expiré',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
