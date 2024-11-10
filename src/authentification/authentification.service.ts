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

@Injectable()
export class AuthentificationService {
  private saltRounds = 10;
  constructor(
    @InjectRepository(User) private userRepository,
    private jwtService: JwtService,
  ) {}

  public async login(user: User): Promise<object> {
    const { username, password } = user;
    if (!username || !password) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    const userFound = await this.userRepository.findOne({
      where: { username },
    });

    if (!userFound) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
    }

    bcrypt.compare(password, userFound.password, (err, res) => {
      if (err) {
        throw new HttpException(err, 500);
      }

      if (!res) {
        throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIAL);
      }
    });

    // generate jwt token
    const payload = { username: userFound.username, sub: userFound.id };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  public async register(user: User): Promise<void> {
    const { username, password } = user;
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

    this.userRepository.save({
      username,
      password: hashedPassword,
    });
  }
}
