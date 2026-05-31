import { DataSource } from 'typeorm';

export function getDatabaseConfig() {
  return {
    type: 'mysql' as const,
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'tontine',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  };
}

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        ...getDatabaseConfig(),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      });

      return dataSource.initialize();
    },
  },
];
