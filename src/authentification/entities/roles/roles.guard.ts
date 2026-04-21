import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { environment } from '../../../shared/config';
import { TontineService } from '../../../tontine/tontine.service';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly tontineService: TontineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: environment.jwtConfig.secret,
      });
      request['user'] = payload;
      const tontineId = request.params.id ?? request.headers['tontine-id'];
      if (!tontineId) {
        return true;
      }

      const memberRole = await this.tontineService.getMemberRole(
        payload.username,
        +tontineId,
      );

      // Si aucun rôle par tontine n'existe (ancienne tontine ou données manquantes),
      // on se rabat sur le rôle global du JWT plutôt que de supposer TONTINARD.
      if (!memberRole) {
        const globalRoles: Role[] = Array.isArray(payload.role)
          ? payload.role
          : [payload.role];
        return this.isRoleMatchOrHigher(requiredRoles, globalRoles);
      }

      return this.isRoleMatchOrHigher(requiredRoles, [memberRole.role]);
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request?.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isRoleMatchOrHigher(
    requiredRoles: Role[],
    userRoles: Role[],
  ): boolean {
    if (userRoles.includes(Role.PRESIDENT)) {
      return true;
    }
    if (requiredRoles.includes(Role.PRESIDENT)) {
      return userRoles.includes(Role.PRESIDENT);
    }

    if (requiredRoles.includes(Role.ACCOUNT_MANAGER)) {
      return userRoles.some(
        (role) => role === Role.ACCOUNT_MANAGER || role === Role.PRESIDENT,
      );
    }

    if (requiredRoles.includes(Role.SECRETARY)) {
      return userRoles.some(
        (role) =>
          role === Role.SECRETARY ||
          role === Role.PRESIDENT ||
          role === Role.ACCOUNT_MANAGER,
      );
    }

    if (requiredRoles.includes(Role.OFFICE_MANAGER)) {
      return userRoles.some(
        (role) =>
          role === Role.OFFICE_MANAGER ||
          role === Role.PRESIDENT ||
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
