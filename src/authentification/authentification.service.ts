import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ErrorCode } from 'src/shared/utilities/error-code';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-dto';
import { Role } from './entities/roles/roles.enum';

@Injectable()
export class AuthentificationService {
  private saltRounds = 10;
  constructor(
    @InjectRepository(User) private userRepository,
    private jwtService: JwtService,
  ) {}

  public async login(username: string, password: string): Promise<object> {
    if (!username || !password) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const userFound = await this.userRepository.findOne({
      where: { username },
    });

    if (!userFound) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    // generate jwt token
    const payload = {
      username: userFound.username,
      id: userFound.id,
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

    const userFound = await this.userRepository.findOne({
      where: { username },
    });

    if (userFound) {
      throw new UnauthorizedException(ErrorCode.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    return this.userRepository.save({
      username,
      password: hashedPassword,
      roles: [role ?? Role.TONTINARD],
    });
  }

  public async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({ where: { username } });
  }
}
