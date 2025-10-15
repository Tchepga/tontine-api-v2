import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TontineService } from './tontine.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@ApiTags('Invitation')
@Controller('invitation')
export class InvitationController {
  constructor(private readonly tontineService: TontineService) {}

  @Post('accept')
  @ApiOperation({
    summary: 'Accepter une invitation',
    description:
      'Accepte une invitation à rejoindre une tontine en créant un compte membre',
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation acceptée avec succès',
    schema: {
      type: 'object',
      properties: {
        member: { type: 'object' },
        message: {
          type: 'string',
          example:
            'Invitation acceptée avec succès. Vous êtes maintenant membre de la tontine.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Token invalide, expiré, ou nom d'utilisateur déjà utilisé",
  })
  @ApiResponse({
    status: 404,
    description: "Lien d'invitation non trouvé",
  })
  acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.tontineService.acceptInvitation(acceptInvitationDto);
  }
}
