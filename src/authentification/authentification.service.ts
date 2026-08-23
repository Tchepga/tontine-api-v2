import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ErrorCode } from 'src/shared/utilities/error-code';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-dto';
import { Role } from './entities/roles/roles.enum';
import { DataSource, EntityManager } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { environment } from 'src/shared/config';
import { MailService } from 'src/mail/mail.service';
import { Member } from 'src/member/entities/member.entity';

@Injectable()
export class AuthentificationService {
  private saltRounds = 10;
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly entityManager: EntityManager,
    private readonly mailService: MailService,
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

    const passwordHased = await this.getHashedPassword(username);

    if (!userFound) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const isMatch = await bcrypt.compare(password, passwordHased);
    if (!isMatch) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const payload = {
      username: userFound.username,
      role: userFound.roles,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      mustChangePassword: !!userFound.mustChangePassword,
    };
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
      throw new ConflictException(ErrorCode.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    const resolvedRole = Array.isArray(role) ? role[0] : role;

    return this.dataSource.getRepository(User).save({
      username,
      password: hashedPassword,
      roles: [resolvedRole ?? Role.TONTINARD],
      mustChangePassword: false,
    });
  }

  public async changePassword(
    username: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    const currentHash = await this.getHashedPassword(username);
    const isMatch = await bcrypt.compare(dto.currentPassword, currentHash);
    if (!isMatch) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    this.validatePasswordLength(dto.newPassword);

    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    user.password = await bcrypt.hash(dto.newPassword, this.saltRounds);
    user.mustChangePassword = false;
    await this.dataSource.getRepository(User).save(user);

    return { success: true };
  }

  public async forgotPassword(
    username: string,
  ): Promise<{ message: string; emailSent?: boolean }> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });

    // Réponse générique pour éviter l'énumération d'utilisateurs
    const genericMessage =
      'Si un compte existe pour cet identifiant, un email de réinitialisation a été envoyé.';

    if (!user) {
      return { message: genericMessage };
    }

    const resetToken = this.jwtService.sign(
      { username, purpose: 'password-reset' },
      { expiresIn: '1h' },
    );

    const member = await this.dataSource.getRepository(Member).findOne({
      where: { user: { username } },
    });

    let emailSent = false;
    if (member?.email && this.mailService.isConfigured()) {
      emailSent = await this.mailService.sendPasswordResetEmail({
        to: member.email,
        username,
        resetToken,
      });
    }

    return { message: genericMessage, emailSent };
  }

  public async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: true }> {
    let payload: { username?: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.token, {
        secret: environment.jwtConfig.secret,
      });
    } catch {
      throw new BadRequestException('Token de réinitialisation invalide ou expiré.');
    }

    if (payload.purpose !== 'password-reset' || !payload.username) {
      throw new BadRequestException('Token de réinitialisation invalide.');
    }

    this.validatePasswordLength(dto.newPassword);

    const user = await this.dataSource.getRepository(User).findOne({
      where: { username: payload.username },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    user.password = await bcrypt.hash(dto.newPassword, this.saltRounds);
    user.mustChangePassword = false;
    await this.dataSource.getRepository(User).save(user);

    return { success: true };
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
    return this.dataSource.getRepository(User).findOne({ where: { username } });
  }

  private validatePasswordLength(password: string): void {
    const { minLength, maxLength } = environment.passwordConfig;
    if (password.length < minLength || password.length > maxLength) {
      throw new BadRequestException(
        `Le mot de passe doit contenir entre ${minLength} et ${maxLength} caractères.`,
      );
    }
  }
}
