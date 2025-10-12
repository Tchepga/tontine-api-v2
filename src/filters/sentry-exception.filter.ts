import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Déterminer le statut HTTP
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extraire le message d'erreur
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Capturer l'exception dans Sentry
    Sentry.withScope((scope) => {
      // Ajouter le contexte de la requête
      scope.setTag('http.method', request.method);
      scope.setTag('http.url', request.url);
      scope.setTag('http.status_code', status.toString());
      scope.setContext('request', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        query: request.query,
        body: this.sanitizeRequestBody(request.body),
      });

      // Ajouter l'utilisateur si disponible
      if ((request as any).user) {
        scope.setUser({
          id: (request as any).user.id,
          username: (request as any).user.username,
          role: (request as any).user.role,
        });
      }

      // Capturer l'exception
      Sentry.captureException(exception);
    });

    // Logger l'erreur localement
    this.logger.error(
      `Exception caught: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Répondre au client
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).send(errorResponse);
  }

  /**
   * Nettoie le body de la requête pour éviter d'envoyer des données sensibles à Sentry
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
    ];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
