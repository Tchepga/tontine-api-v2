import { Injectable, LoggerService as NestLoggerService, Inject, Optional } from '@nestjs/common';
import * as Sentry from '@sentry/node';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  LOG = 'log',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly context?: string;

  constructor(@Optional() @Inject('LOGGER_CONTEXT') context?: string) {
    this.context = context;
  }

  /**
   * Log d'erreur avec capture Sentry
   */
  error(message: any, trace?: string, context?: string): void {
    const logContext = context || this.context || 'Application';
    
    // Log local
    console.error(`[${logContext}] ERROR:`, message);
    if (trace) {
      console.error(`[${logContext}] STACK:`, trace);
    }

    // Capture dans Sentry
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTag('logger', logContext);
      scope.setContext('error', {
        message: typeof message === 'string' ? message : JSON.stringify(message),
        trace,
      });
      Sentry.captureMessage(message, 'error');
    });
  }

  /**
   * Log d'avertissement avec capture Sentry
   */
  warn(message: any, context?: string): void {
    const logContext = context || this.context || 'Application';
    
    // Log local
    console.warn(`[${logContext}] WARN:`, message);

    // Capture dans Sentry
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setTag('logger', logContext);
      Sentry.captureMessage(message, 'warning');
    });
  }

  /**
   * Log d'information
   */
  log(message: any, context?: string): void {
    const logContext = context || this.context || 'Application';
    console.log(`[${logContext}] INFO:`, message);
  }

  /**
   * Log de debug
   */
  debug(message: any, context?: string): void {
    const logContext = context || this.context || 'Application';
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      console.debug(`[${logContext}] DEBUG:`, message);
    }
  }

  /**
   * Log verbeux
   */
  verbose(message: any, context?: string): void {
    const logContext = context || this.context || 'Application';
    if (process.env.NODE_ENV === 'development' || process.env.VERBOSE === 'true') {
      console.log(`[${logContext}] VERBOSE:`, message);
    }
  }

  /**
   * Log d'activité utilisateur (pour audit)
   */
  logUserActivity(userId: string, action: string, details?: any): void {
    const message = `User ${userId} performed ${action}`;
    this.log(message, 'UserActivity');
    
    // Capture dans Sentry avec contexte utilisateur
    Sentry.withScope((scope) => {
      scope.setLevel('info');
      scope.setTag('activity', 'user_action');
      scope.setUser({ id: userId });
      scope.setContext('user_activity', {
        action,
        details,
        timestamp: new Date().toISOString(),
      });
      Sentry.captureMessage(message, 'info');
    });
  }

  /**
   * Log de performance
   */
  logPerformance(operation: string, duration: number, context?: string): void {
    const logContext = context || this.context || 'Performance';
    const message = `Operation '${operation}' took ${duration}ms`;
    
    this.log(message, logContext);
    
    // Capture dans Sentry si la durée est élevée
    if (duration > 1000) { // Plus de 1 seconde
      Sentry.withScope((scope) => {
        scope.setLevel('warning');
        scope.setTag('performance', 'slow_operation');
        scope.setContext('performance', {
          operation,
          duration,
          threshold: 1000,
        });
        Sentry.captureMessage(`Slow operation: ${message}`, 'warning');
      });
    }
  }

  /**
   * Log d'erreur avec exception
   */
  logException(exception: Error, context?: string): void {
    const logContext = context || this.context || 'Exception';
    
    this.error(exception.message, exception.stack, logContext);
    
    // Capture l'exception dans Sentry
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTag('logger', logContext);
      scope.setContext('exception', {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      });
      Sentry.captureException(exception);
    });
  }

  /**
   * Log de requête HTTP
   */
  logHttpRequest(method: string, url: string, statusCode: number, duration?: number): void {
    const message = `${method} ${url} - ${statusCode}${duration ? ` (${duration}ms)` : ''}`;
    
    if (statusCode >= 400) {
      this.warn(message, 'HTTP');
    } else {
      this.log(message, 'HTTP');
    }
  }

  /**
   * Créer un logger avec un contexte spécifique
   */
  static create(context: string): LoggerService {
    return new LoggerService(context);
  }

  /**
   * Créer un logger avec un contexte spécifique (méthode d'instance)
   */
  withContext(context: string): LoggerService {
    return new LoggerService(context);
  }
}
