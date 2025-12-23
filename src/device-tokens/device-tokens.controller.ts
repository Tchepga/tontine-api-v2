import { Body, Controller, Delete, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../authentification/entities/roles/roles.decorator';
import { Role } from '../authentification/entities/roles/roles.enum';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { DeviceTokensService } from './device-tokens.service';

@ApiTags('Notification')
@ApiBearerAuth('JWT-auth')
@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  @Roles(Role.TONTINARD)
  register(@Body() dto: RegisterDeviceTokenDto, @Req() req: any) {
    return this.deviceTokensService.register(dto, req.user);
  }

  @Delete(':token')
  @Roles(Role.TONTINARD)
  unregister(@Param('token') token: string, @Req() req: any) {
    return this.deviceTokensService.unregister(token, req.user);
  }
}


