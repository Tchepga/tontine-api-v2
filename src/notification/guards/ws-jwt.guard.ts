import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { environment } from '../../shared/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      throw new WsException('Token manquant');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: environment.jwtConfig.secret,
      });
      client.data.user = payload;
      return true;
    } catch {
      throw new WsException('Token invalide');
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    // Le token est passé dans les query params (ex: ?token=xxx)
    const tokenFromQuery = client.handshake.query?.token;
    if (tokenFromQuery) {
      // Gérer le cas où tokenFromQuery peut être un string ou un array
      const token =
        typeof tokenFromQuery === 'string'
          ? tokenFromQuery
          : Array.isArray(tokenFromQuery)
            ? tokenFromQuery[0]
            : undefined;
      if (token) {
        return token;
      }
    }

    // Fallback: essayer d'extraire le token depuis les headers Authorization
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ') ?? [];
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return undefined;
  }
}
