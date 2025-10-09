import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { initSentry } from './sentry.config';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  try {
    // Initialize Sentry
    initSentry();

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        bodyLimit: 10 * 1024 * 1024, // 10MB
      }),
    );

    // Enregistrer le filtre d'exceptions Sentry global
    app.useGlobalFilters(new SentryExceptionFilter());

    // Enregistrer l'interceptor de logging global
    app.useGlobalInterceptors(new LoggingInterceptor());

    // TODO: need to restrict validation
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');

    await app.listen({
      port: 3000,
      host: 'localhost',
    });

    console.log('🚀 Application démarrée avec Sentry configuré');
    console.log('📊 Sentry capture les erreurs et les performances');
    console.log('🔍 Consultez votre dashboard Sentry pour voir les données');
  } catch (error) {
    console.error("❌ Erreur lors du démarrage de l'application:", error);
    // Capturer l'erreur de bootstrap dans Sentry
    Sentry.captureException(error);
    process.exit(1);
  }
}
bootstrap();
