import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';
import { Role } from 'src/authentification/entities/roles/roles.enum';

@Controller('event')
@UseGuards(RolesGuard)
@Roles(Role.TONTINARD)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventService.create(createEventDto, req.user);
  }

  @Get('/tontine/:tontineId')
  findAll(@Param('tontineId') tontineId: string, @Req() req: any) {
    return this.eventService.findAll(+tontineId, req.user.username);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.eventService.findOne(+id, req.user.username);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: any
  ) {
    return this.eventService.update(+id, updateEventDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.eventService.remove(+id, req.user);
  }

  @Patch(':id/add-participant/:participantId')
  addParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Req() req: any,
  ) {
    return this.eventService.addParticipant(
      +id,
      +participantId,
      req.user.username,
    );
  }

  @Patch(':id/remove-participant/:participantId')
  removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Req() req: any,
  ) {
    return this.eventService.removeParticipant(
      +id,
      +participantId,
      req.user.username,
    );
  }
}
