import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notification')
@UseGuards(RolesGuard)
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
}
