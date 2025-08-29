import { environment as devEnvironment } from './environement';

// Configuration de production basée sur les variables d'environnement
// TODO: .env ne marche pas lorsqu'on fait node dist/main.js
const prodEnvironment = {
  production: true,
  jwtConfig: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    global: true,
  },
  databaseConfig: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_DATABASE || 'tontine',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    autoLoadEntities: true,
  },
  passwordConfig: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '100', 10),
    defaultPassword: process.env.DEFAULT_PASSWORD || 'changeme1@',
  },
};

export const environment =
  process.env.NODE_ENV === 'production' ? prodEnvironment : devEnvironment;

console.log('NODE_ENV', process.env.NODE_ENV);
