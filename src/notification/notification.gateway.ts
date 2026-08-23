import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { environment } from 'src/shared/config';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.query?.token as string | undefined) ??
      (client.handshake.auth?.token as string | undefined);

    if (!token) {
      this.logger.warn('Connexion WebSocket refusée : token manquant');
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: environment.jwtConfig.secret,
      });
      client.data.user = payload;
    } catch {
      this.logger.warn('Connexion WebSocket refusée : token invalide');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client déconnecté : ${client.id}`);
  }

  @SubscribeMessage('createNotification')
  create(
    @MessageBody() createNotificationDto: CreateNotificationDto,
    client: Socket,
  ) {
    if (!client.data.user) {
      return { error: 'Non authentifié' };
    }
    return this.notificationService.create(
      createNotificationDto,
      client.data.user,
    );
  }

  @SubscribeMessage('findAllNotification')
  findAll(@MessageBody() tontineId: number, client: Socket) {
    if (!client.data.user) {
      return { error: 'Non authentifié' };
    }
    return this.notificationService.findFromTontine(
      tontineId,
      client.data.user.username,
    );
  }

  @SubscribeMessage('findOneNotification')
  findOne(@MessageBody() id: number, client: Socket) {
    if (!client.data.user) {
      return { error: 'Non authentifié' };
    }
    return this.notificationService.findOne(id);
  }

  @SubscribeMessage('updateNotification')
  update(@MessageBody() updateNotificationDto: UpdateNotificationDto, client: Socket) {
    if (!client.data.user) {
      return { error: 'Non authentifié' };
    }
    return this.notificationService.update(
      updateNotificationDto.id,
      updateNotificationDto,
    );
  }

  @SubscribeMessage('removeNotification')
  remove(@MessageBody() id: number, client: Socket) {
    if (!client.data.user) {
      return { error: 'Non authentifié' };
    }
    return this.notificationService.remove(id);
  }
}
