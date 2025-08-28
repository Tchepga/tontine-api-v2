import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ErrorCode } from '../shared/utilities/error-code';
import { DataSource, EntityManager } from 'typeorm';
import { LoginDto } from './dto/login-dto';
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
    return this.dataSource.getRepository(User).findOne({ where: { username } });
  }
}
