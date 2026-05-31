import { getDatabaseConfig } from '../database.provider';
import { environment as devEnvironment } from './environement';

// Configuration de production basée sur les variables d'environnement
const prodEnvironment = {
  production: true,
  jwtConfig: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    global: true,
  },
  databaseConfig: getDatabaseConfig(),
  passwordConfig: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '100', 10),
    defaultPassword: process.env.DEFAULT_PASSWORD || 'changeme1@',
  },
};

export const environment =
  process.env.NODE_ENV === 'production'
    ? prodEnvironment
    : {
        ...devEnvironment,
        databaseConfig: getDatabaseConfig(),
      }; 