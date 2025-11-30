import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Req
} from '@nestjs/common';
import { Roles } from '../authentification/entities/roles/roles.decorator';
import { Role } from '../authentification/entities/roles/roles.enum';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationService } from './notification.service';

@Controller('notification')
@Roles(Role.TONTINARD)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  constructor(private readonly notificationService: NotificationService) {}

  @Get('tontine/:tontineId')
  async findAll(@Param('tontineId') tontineId: string) {
    return this.notificationService.findFromTontine(+tontineId);
  }

  @Post()
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() req: any,
  ) {
    return this.notificationService.create(createNotificationDto, req.user);
  }

  @Patch(':id/status/read')
  async updateStatus(@Param('id') id: string) {
    try {
      this.logger.log(`Tentative de mise à jour du statut pour l'ID: ${id}`);
      const result = await this.notificationService.updateStatusRead(+id);
      this.logger.log(`Mise à jour réussie pour l'ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du statut pour l'ID ${id}:`,
        JSON.stringify(error),
      );
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du statut de lecture de la notification' +
          JSON.stringify(error),
      );
    }
  }
}
