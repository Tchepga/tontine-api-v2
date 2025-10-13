import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import 'dotenv/config';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';
import { initSentry } from './sentry.config';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

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

    // Enregistrer le filtre d'exceptions Sentry global seulement si Sentry est activé
    if (process.env.SENTRY_ENABLED !== 'false') {
      app.useGlobalFilters(new SentryExceptionFilter());
    }

    // Enregistrer l'interceptor de logging global
    app.useGlobalInterceptors(new LoggingInterceptor());

    // TODO: need to restrict validation
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');

    // Configuration pour servir les fichiers statiques (nécessaire pour Swagger avec Fastify)
    await app.register(require('@fastify/static'), {
      root: join(__dirname, '..', 'node_modules', 'swagger-ui-dist'),
      prefix: '/swagger-ui/',
    });

    // Configuration Swagger
    const config = new DocumentBuilder()
      .setTitle('API Tontine')
      .setDescription(
        'API pour la gestion des tontines - Documentation complète des endpoints',
      )
      .setVersion('2.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Entrez votre token JWT',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag(
        'Authentification',
        "Gestion de l'authentification et des utilisateurs",
      )
      .addTag('Tontine', 'Gestion des tontines et de leurs configurations')
      .addTag('Membre', 'Gestion des membres des tontines')
      .addTag('Prêt', 'Gestion des prêts')
      .addTag('Événement', 'Gestion des événements')
      .addTag('Notification', 'Gestion des notifications')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .scheme-container { background: #fafafa; padding: 10px; border-radius: 4px; margin: 20px 0 }
        .swagger-ui .btn.authorize { background-color: #4CAF50; border-color: #4CAF50; }
        .swagger-ui .btn.authorize:hover { background-color: #45a049; }
      `,
      customSiteTitle: 'API Tontine - Documentation',
      customfavIcon: '/favicon.ico',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
      ],
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
      ],
    });

    await app.listen({
      port: 3000,
      host: 'localhost',
    });

    if (process.env.SENTRY_ENABLED !== 'false') {
      console.log('🚀 Application démarrée avec Sentry configuré');
      console.log('📊 Sentry capture les erreurs et les performances');
      console.log('🔍 Consultez votre dashboard Sentry pour voir les données');
    } else {
      console.log('🚀 Application démarrée sans Sentry');
      console.log('📊 Sentry est désactivé pour cet environnement');
    }
  } catch (error) {
    console.error("❌ Erreur lors du démarrage de l'application:", error);
    // Capturer l'erreur de bootstrap dans Sentry seulement si Sentry est activé
    if (process.env.SENTRY_ENABLED !== 'false') {
      Sentry.captureException(error);
    }
    process.exit(1);
  }
}
bootstrap();
