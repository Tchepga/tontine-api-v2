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
    username: 'root',
    password: 'root',
    database: 'tontine',
    synchronize: true,
    autoLoadEntities: true,
  },
};
