import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';

function fastifyMajorVersion(): number {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const version = require('fastify/package.json').version as string;
  return parseInt(version.split('.')[0] ?? '0', 10);
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 10 * 1024 * 1024, // 10MB
    }),
  );

  // @fastify/helmet 13+ exige Fastify 5 ; Nest 10 embarque Fastify 4.
  if (fastifyMajorVersion() >= 5) {
    await app.register(helmet);
  } else {
    console.warn(
      '[bootstrap] @fastify/helmet ignoré (Fastify 4 — mettre à jour Nest/Fastify ou pin helmet@11)',
    );
  }

  const corsOrigins = process.env.CORS_ORIGINS?.trim();
  app.enableCors({
    origin: corsOrigins
      ? corsOrigins.split(',').map((origin) => origin.trim())
      : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT || '8080', 10);
  // 0.0.0.0 : accessible derrière reverse proxy / depuis le réseau (prod).
  await app.listen({
    port,
    host: '0.0.0.0',
  });
}
bootstrap();
