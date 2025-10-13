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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RolesGuard } from '../authentification/entities/roles/roles.guard';
import { Roles } from '../authentification/entities/roles/roles.decorator';
import { Role } from '../authentification/entities/roles/roles.enum';

@ApiTags('Événement')
@ApiBearerAuth('JWT-auth')
@Controller('event')
@UseGuards(RolesGuard)
@Roles(Role.TONTINARD)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouvel événement',
    description: 'Crée un nouvel événement dans une tontine',
  })
  @ApiResponse({
    status: 201,
    description: 'Événement créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventService.create(createEventDto, req.user);
  }

  @Get('/tontine/:tontineId')
  @ApiOperation({
    summary: 'Récupérer tous les événements d\'une tontine',
    description: 'Récupère la liste de tous les événements d\'une tontine spécifique',
  })
  @ApiParam({
    name: 'tontineId',
    description: 'ID de la tontine',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des événements récupérée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tontine non trouvée',
  })
  findAll(@Param('tontineId') tontineId: string) {
    return this.eventService.findAll(+tontineId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un événement par ID',
    description: 'Récupère les détails d\'un événement spécifique',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'événement',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Événement trouvé',
  })
  @ApiResponse({
    status: 404,
    description: 'Événement non trouvé',
  })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un événement',
    description: 'Met à jour les informations d\'un événement existant',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'événement',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Événement mis à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Événement non trouvé',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Seul le créateur peut modifier',
  })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: any,
  ) {
    return this.eventService.update(+id, updateEventDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un événement',
    description: 'Supprime un événement (seul le créateur peut le faire)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'événement',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Événement supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Événement non trouvé',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Seul le créateur peut supprimer',
  })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.eventService.remove(+id, req.user);
  }

  @Patch(':id/add-participant/:participantId')
  @ApiOperation({
    summary: 'Ajouter un participant à un événement',
    description: 'Ajoute un participant à un événement existant',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'événement',
    example: 1,
  })
  @ApiParam({
    name: 'participantId',
    description: 'ID du participant à ajouter',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Participant ajouté avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Événement ou participant non trouvé',
  })
  addParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    return this.eventService.addParticipant(+id, +participantId);
  }

  @Patch(':id/remove-participant/:participantId')
  @ApiOperation({
    summary: 'Retirer un participant d\'un événement',
    description: 'Retire un participant d\'un événement existant',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'événement',
    example: 1,
  })
  @ApiParam({
    name: 'participantId',
    description: 'ID du participant à retirer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Participant retiré avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Événement ou participant non trouvé',
  })
  removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    return this.eventService.removeParticipant(+id, +participantId);
  }
}
