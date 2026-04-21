import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly customLogger = LoggerService.create('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const { method, url, body, query, params, headers } = request;
    const userAgent = (headers['user-agent'] as string) || '';
    const ip = this.getClientIp(request);
    const startTime = Date.now();
    // Log de la requête entrante
    this.logRequest(method, url, { body, query, params, userAgent, ip });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode ?? 200;
        // Log de la réponse
        this.logResponse(method, url, statusCode, duration, data);
        // Log de performance si nécessaire
        if (duration > 1000) {
          this.customLogger.logPerformance(`${method} ${url}`, duration);
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        // Log de l'erreur
        this.logError(method, url, statusCode, duration, error);
        // Capture dans Sentry avec contexte de la requête
        Sentry.withScope((scope) => {
          scope.setTag('http.method', method);
          scope.setTag('http.url', url);
          scope.setTag('http.status_code', statusCode.toString());
          scope.setContext('request', {
            method,
            url,
            body: this.sanitizeRequestBody(body),
            query,
            params,
            userAgent,
            ip,
            duration,
          });
          scope.setUser(this.extractUserFromRequest(request));
          Sentry.captureException(error);
        });
        throw error;
      }),
    );
  }

  private logRequest(method: string, url: string, context: any): void {
    const message = `→ ${method} ${url}`;
    this.customLogger.log(message, 'HTTP');
    // Log détaillé en mode debug
    if (process.env.NODE_ENV === 'development') {
      this.customLogger.debug(
        `Request details: ${JSON.stringify(context, null, 2)}`,
        'HTTP',
      );
    }
  }

  private logResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    data?: any,
  ): void {
    const message = `← ${method} ${url} - ${statusCode} (${duration}ms)`;

    if (statusCode >= 400) {
      this.customLogger.warn(message, 'HTTP');
    } else {
      this.customLogger.log(message, 'HTTP');
    }

    // Log de la taille de la réponse en mode debug
    if (process.env.NODE_ENV === 'development' && data) {
      const responseSize = JSON.stringify(data).length;
      this.customLogger.debug(`Response size: ${responseSize} bytes`, 'HTTP');
    }
  }

  private logError(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    error: any,
  ): void {
    const message = `✗ ${method} ${url} - ${statusCode} (${duration}ms) - ${error.message}`;
    this.customLogger.error(message, error.stack, 'HTTP');
  }

  private getClientIp(request: FastifyRequest): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private extractUserFromRequest(request: FastifyRequest): any {
    return (request as any).user || null;
  }

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
      'refreshToken',
      'accessToken',
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
