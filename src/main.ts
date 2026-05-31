import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 10 * 1024 * 1024, // 10MB
    })
  );

  // TODO: need to restrict validation
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '127.0.0.1';

  await app.listen({ port, host });
  console.log(`Application running on http://${host}:${port}/api`);
}
bootstrap();
