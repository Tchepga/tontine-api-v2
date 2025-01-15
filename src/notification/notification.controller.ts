import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';

@Controller('notification')
@UseGuards(RolesGuard)
@Roles(Role.TONTINARD)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(@Query('tontine') tontineId: string) {
    return this.notificationService.findFromTontine(+tontineId);
  }
}
