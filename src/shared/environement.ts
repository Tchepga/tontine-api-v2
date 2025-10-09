export const environment = {
  production: false,
  jwtConfig: {
    secret: 'Ceci est la valeur de la phrase secrete pour le token',
    expiresIn: '24h',
    global: true,
  },
  databaseConfig: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'u256492878_mytontine',
    password: 'changeme1@',
    database: 'u256492878_mytontine',
    synchronize: true,
    autoLoadEntities: true,
  },
  passwordConfig: {
    minLength: 8,
    maxLength: 100,
    defaultPassword: 'changeme1@',
  },
};
