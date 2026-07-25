import { config as loadEnv } from 'dotenv';
import { environment as devEnvironment } from './environement';

// Charge .env avant toute lecture de process.env (dev local + prod après deploy).
loadEnv({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET must be set when NODE_ENV=production (see .env / env.example)',
  );
}

const prodEnvironment = {
  production: true,
  jwtConfig: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    global: true,
  },
  databaseConfig: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'tontine',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    autoLoadEntities: true,
  },
  passwordConfig: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '100', 10),
    defaultPassword: process.env.DEFAULT_PASSWORD || 'changeme1@',
  },
  mailConfig: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || '',
    enabled: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
  },
};

export const environment = isProduction ? prodEnvironment : devEnvironment;
