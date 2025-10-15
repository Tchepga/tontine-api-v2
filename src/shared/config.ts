export const environment = {
  production: process.env.NODE_ENV === 'production',
  jwtConfig: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
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
    synchronize: true,
    autoLoadEntities: true,
    logging: false,
  },
  passwordConfig: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '100', 10),
    defaultPassword: process.env.DEFAULT_PASSWORD || 'changeme1@',
  },
};
