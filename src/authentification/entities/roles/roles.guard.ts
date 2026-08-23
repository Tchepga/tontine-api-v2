// src/auth/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from '../public.decorator';
import { SKIP_TONTINE_CONTEXT_KEY } from './skip-tontine-context.decorator';
import { JwtService } from '@nestjs/jwt';
import { environment } from 'src/shared/config';
import { TontineService } from 'src/tontine/tontine.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly tontineService: TontineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Auth by default: JWT obligatoire sauf @Public().
    // Sans @Roles, un token valide suffit (pas de check de rôle tontine).
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException(
        'Authentification requise. Veuillez vous reconnecter.',
      );
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: environment.jwtConfig.secret,
      });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException(
        'Session expirée ou invalide. Veuillez vous reconnecter.',
      );
    }

    if (!requiredRoles?.length) {
      return true;
    }

    const skipTontineContext = this.reflector.getAllAndOverride<boolean>(
      SKIP_TONTINE_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipTontineContext) {
      return true;
    }

    // Préférer le header : sur /loan/:id, params.id est l'ID du prêt.
    const tontineId =
      request.headers['tontine-id'] ??
      request.params.tontineId ??
      request.params.id;
    if (!tontineId) {
      throw new ForbiddenException(
        'Contexte tontine requis pour cette action (header tontine-id ou paramètre tontine).',
      );
    }

    const memberRoles = await this.tontineService.getMemberRoles(
      payload.username,
      +tontineId,
    );

    if (!memberRoles?.length) {
      throw new ForbiddenException(
        "Vous n'êtes pas membre de cette tontine.",
      );
    }

    const userRoles = memberRoles.map((memberRole) => memberRole.role);
    if (!this.isRoleMatchOrHigher(requiredRoles, userRoles)) {
      throw new ForbiddenException(this.buildForbiddenMessage(requiredRoles));
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request?.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private buildForbiddenMessage(requiredRoles: Role[]): string {
    if (requiredRoles.includes(Role.PRESIDENT)) {
      return 'Seul le président peut effectuer cette action.';
    }
    if (requiredRoles.includes(Role.ACCOUNT_MANAGER)) {
      return 'Seuls le président, le vice-président ou le trésorier peuvent effectuer cette action.';
    }
    if (requiredRoles.includes(Role.SECRETARY)) {
      return 'Seuls les membres du bureau (président, vice-président, trésorier ou secrétaire) peuvent effectuer cette action.';
    }
    if (requiredRoles.includes(Role.OFFICE_MANAGER)) {
      return 'Seuls les membres du bureau peuvent effectuer cette action.';
    }
    return "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
  }

  private isRoleMatchOrHigher(
    requiredRoles: Role[],
    userRoles: Role[],
  ): boolean {
    if (userRoles.includes(Role.PRESIDENT)) {
      return true;
    }

    // Vice-président : tous les droits sauf ceux strictement réservés au président
    if (
      userRoles.includes(Role.VICE_PRESIDENT) &&
      !requiredRoles.includes(Role.PRESIDENT)
    ) {
      return true;
    }

    if (requiredRoles.includes(Role.PRESIDENT)) {
      return userRoles.includes(Role.PRESIDENT);
    }

    if (requiredRoles.includes(Role.ACCOUNT_MANAGER)) {
      return userRoles.some(
        (role) =>
          role === Role.ACCOUNT_MANAGER ||
          role === Role.VICE_PRESIDENT ||
          role === Role.PRESIDENT,
      );
    }

    if (requiredRoles.includes(Role.SECRETARY)) {
      return userRoles.some(
        (role) =>
          role === Role.SECRETARY ||
          role === Role.PRESIDENT ||
          role === Role.VICE_PRESIDENT ||
          role === Role.ACCOUNT_MANAGER,
      );
    }

    if (requiredRoles.includes(Role.OFFICE_MANAGER)) {
      return userRoles.some(
        (role) =>
          role === Role.OFFICE_MANAGER ||
          role === Role.PRESIDENT ||
          role === Role.VICE_PRESIDENT ||
          role === Role.ACCOUNT_MANAGER ||
          role === Role.SECRETARY,
      );
    }

    if (requiredRoles.includes(Role.TONTINARD)) {
      return userRoles.some((role) => Object.values(Role).includes(role));
    }

    return false;
  }
}
