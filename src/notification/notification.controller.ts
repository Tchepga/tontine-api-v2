import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationService } from './notification.service';

@Controller('notification')
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
  updateStatus(@Param('id') id: string) {
    return this.notificationService.updateStatusRead(+id);
  }
}
