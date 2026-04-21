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
import { EmailService } from '../shared/services/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login-dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from './entities/roles/roles.enum';
import { User } from './entities/user.entity';
import { Member } from 'src/member/entities/member.entity';

@Injectable()
export class AuthentificationService {
  private saltRounds = 10;
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly entityManager: EntityManager,
    private readonly emailService: EmailService,
  ) {}

  public async verify(token: string): Promise<boolean> {
    try {
      await this.jwtService.verify(token);
      return true;
    } catch {
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
  ): Promise<{ message: string }> {
    const { usernameOrEmail } = forgotPasswordDto;

    // Rechercher l'utilisateur par nom d'utilisateur ou email
    const member = await this.dataSource.getRepository(Member).findOne({
      where: [
        { user: { username: usernameOrEmail } },
        { email: usernameOrEmail },
      ],
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que le membre a un email
    if (!member.email) {
      throw new BadRequestException(
        'Aucun email associé à ce compte. Veuillez contacter un administrateur.',
      );
    }

    // Générer un token de réinitialisation (valide 1 heure)
    const resetToken = this.jwtService.sign(
      {
        username: member.user.username,
        type: 'password_reset',
      },
      {
        expiresIn: '1h',
      },
    );

    // Envoyer l'email de réinitialisation
    try {
      await this.emailService.sendPasswordResetEmail(
        member.email,
        resetToken,
        member.user.username,
      );
    } catch {
      throw new BadRequestException(
        "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.",
      );
    }

    return {
      message:
        'Un email de réinitialisation a été envoyé à votre adresse email.',
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
