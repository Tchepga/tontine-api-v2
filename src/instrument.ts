import { config as loadEnv } from 'dotenv';
import * as Sentry from '@sentry/nestjs';

loadEnv({ quiet: true });

const dsn = process.env.SENTRY_DSN?.trim();
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
  });
}
