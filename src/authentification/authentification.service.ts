import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';
import { ErrorCode } from '../shared/utilities/error-code';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login-dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from './entities/roles/roles.enum';
import { User } from './entities/user.entity';

@Injectable()
export class AuthentificationService {
  private saltRounds = 10;
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly entityManager: EntityManager,
  ) {}

  public async verify(token: string): Promise<boolean> {
    try {
      await this.jwtService.verify(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async login(username: string, password: string): Promise<object> {
    if (!username || !password) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const userFound = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });

    const passwordHased = await this.getHashedPassword(username); // password is never export into user entity

    if (!userFound) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const isMatch = await bcrypt.compare(password, passwordHased);
    if (!isMatch) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    // generate jwt token
    const payload = {
      username: userFound.username,
      role: userFound.roles,
    };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  public async register(userData: LoginDto): Promise<User> {
    const { username, password, role } = userData;

    if (!username || !password) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const userFound = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });

    if (userFound) {
      throw new UnauthorizedException(ErrorCode.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    return this.dataSource.getRepository(User).save({
      username,
      password: hashedPassword,
      roles: [role ?? Role.TONTINARD],
    });
  }

  public async findByUsername(username: string): Promise<User> {
    return this.dataSource.getRepository(User).findOne({ where: { username } });
  }

  private async getHashedPassword(username: string): Promise<string> {
    const query = `
      SELECT password FROM user
      WHERE username = ?
    `;
    const params = [username];

    const result = await this.entityManager.query(query, params);
    return result && result.length ? result[0]?.password : '';
  }

  public async getUserByUsername(username: string): Promise<User> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
      select: ['username', 'roles'], // Exclure le mot de passe
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  public async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken: string }> {
    const { usernameOrEmail } = forgotPasswordDto;

    // Rechercher l'utilisateur par nom d'utilisateur ou email
    const user = await this.dataSource.getRepository(User).findOne({
      where: { username: usernameOrEmail },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Générer un token de réinitialisation (valide 1 heure)
    const resetToken = this.jwtService.sign(
      {
        username: user.username,
        type: 'password_reset',
      },
      {
        expiresIn: '1h',
      },
    );

    // En production, vous devriez envoyer un email avec le token
    // Pour l'instant, on retourne le token directement
    return {
      message:
        'Token de réinitialisation généré. En production, un email serait envoyé.',
      resetToken,
    };
  }

  public async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    try {
      // Vérifier le token
      const decoded = this.jwtService.verify(token);

      if (decoded.type !== 'password_reset') {
        throw new BadRequestException('Token invalide');
      }

      const username = decoded.username;

      // Vérifier que l'utilisateur existe
      const user = await this.dataSource.getRepository(User).findOne({
        where: { username },
      });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

      // Mettre à jour le mot de passe
      await this.dataSource
        .getRepository(User)
        .update({ username }, { password: hashedPassword });

      return {
        message: 'Mot de passe réinitialisé avec succès',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token expiré');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token invalide');
      }
      throw error;
    }
  }
}
