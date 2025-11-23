import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, Inject, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { DataSource } from 'typeorm';
import { Member } from '../member/entities/member.entity';
import { Tontine } from '../tontine/entities/tontine.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connectedClients = new Map<
    string,
    { userId: string; username: string; memberId?: number }
  >();

  constructor(
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connecting: ${client.id}`);

    try {
      // L'authentification sera gérée par le guard lors des messages
      // Pour l'instant, on accepte la connexion
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnecting: ${client.id}`);
    const clientData = this.connectedClients.get(client.id);

    if (clientData) {
      // Retirer le client de toutes les rooms
      const tontines = await this.getTontinesForMember(clientData.memberId);
      tontines.forEach((tontine) => {
        client.leave(`tontine:${tontine.id}`);
      });

      this.connectedClients.delete(client.id);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinTontine')
  async handleJoinTontine(
    @ConnectedSocket() client: Socket,
    @MessageBody() tontineId: number,
  ) {
    const user = client.data.user;
    if (!user) {
      return { error: 'Non authentifié' };
    }

    try {
      // Vérifier que l'utilisateur est membre de la tontine
      const member = await this.dataSource.getRepository(Member).findOne({
        where: { user: { username: user.username } },
        relations: ['tontines'],
      });

      if (!member) {
        return { error: 'Membre non trouvé' };
      }

      const tontine = member.tontines?.find((t) => t.id === tontineId);
      if (!tontine) {
        return { error: "Vous n'êtes pas membre de cette tontine" };
      }

      // Rejoindre la room de la tontine
      client.join(`tontine:${tontineId}`);

      // Stocker les informations du client
      this.connectedClients.set(client.id, {
        userId: user.sub || user.userId,
        username: user.username,
        memberId: member.id,
      });

      this.logger.log(
        `Client ${client.id} (${user.username}) a rejoint la tontine ${tontineId}`,
      );
      return { success: true, message: `Rejoint la tontine ${tontineId}` };
    } catch (error) {
      this.logger.error(`Erreur lors de la jointure: ${error.message}`);
      return { error: 'Erreur lors de la jointure' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveTontine')
  async handleLeaveTontine(
    @ConnectedSocket() client: Socket,
    @MessageBody() tontineId: number,
  ) {
    client.leave(`tontine:${tontineId}`);
    this.logger.log(`Client ${client.id} a quitté la tontine ${tontineId}`);
    return { success: true, message: `Quitté la tontine ${tontineId}` };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('createNotification')
  create(
    @MessageBody() createNotificationDto: CreateNotificationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    return this.notificationService.create(createNotificationDto, user);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('findAllNotification')
  findAll(@MessageBody() tontineId: number) {
    return this.notificationService.findFromTontine(tontineId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('findOneNotification')
  findOne(@MessageBody() id: number) {
    return this.notificationService.findOne(id);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('updateNotification')
  update(@MessageBody() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.updateStatusRead(updateNotificationDto.id);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('removeNotification')
  remove(@MessageBody() id: number) {
    return this.notificationService.remove(id);
  }

  /**
   * Émet une notification à un membre spécifique
   */
  async emitToMember(memberId: number, notification: any) {
    // Trouver tous les clients connectés pour ce membre
    const clientsForMember = Array.from(this.connectedClients.entries())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, data]) => data.memberId === memberId)
      .map(([clientId]) => this.server.sockets.sockets.get(clientId))
      .filter((socket) => socket !== undefined);

    clientsForMember.forEach((client) => {
      client.emit('notification', notification);
    });

    this.logger.log(
      `Notification envoyée au membre ${memberId} (${clientsForMember.length} client(s))`,
    );
  }

  /**
   * Émet une notification à tous les membres d'une tontine
   */
  async emitToTontine(tontineId: number, notification: any) {
    this.server.to(`tontine:${tontineId}`).emit('notification', notification);
    this.logger.log(
      `Notification envoyée à tous les membres de la tontine ${tontineId}`,
    );
  }

  /**
   * Récupère toutes les tontines d'un membre
   */
  private async getTontinesForMember(memberId?: number): Promise<Tontine[]> {
    if (!memberId) {
      return [];
    }

    const member = await this.dataSource.getRepository(Member).findOne({
      where: { id: memberId },
      relations: ['tontines'],
    });

    return member?.tontines || [];
  }
}
