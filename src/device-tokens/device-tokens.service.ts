import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../authentification/entities/user.entity';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { DeviceToken } from './entities/device-token.entity';

@Injectable()
export class DeviceTokensService {
  constructor(private readonly dataSource: DataSource) {}

  async register(dto: RegisterDeviceTokenDto, userPayload: any) {
    const username = userPayload?.username;
    if (!username) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    const repo = this.dataSource.getRepository(DeviceToken);
    const existing = await repo.findOne({ where: { token: dto.token } });

    if (existing) {
      existing.platform = dto.platform;
      existing.user = user;
      return repo.save(existing);
    }

    const tokenEntity = new DeviceToken();
    tokenEntity.token = dto.token;
    tokenEntity.platform = dto.platform;
    tokenEntity.user = user;
    return repo.save(tokenEntity);
  }

  async unregister(token: string, userPayload: any) {
    const username = userPayload?.username;
    if (!username) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    const repo = this.dataSource.getRepository(DeviceToken);
    const existing = await repo.findOne({
      where: { token, user: { username: user.username } },
    });
    if (!existing) {
      return { success: true };
    }

    await repo.delete({ id: existing.id });
    return { success: true };
  }
}


