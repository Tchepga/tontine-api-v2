#!/usr/bin/env node

import mysql from 'mysql2/promise';
import { environment } from '../dist/shared/config.js';

async function checkDatabase() {
  console.log('🔍 Vérification de la connexion à la base de données...');
  console.log('Configuration:', {
    host: environment.databaseConfig.host,
    port: environment.databaseConfig.port,
    username: environment.databaseConfig.username,
    database: environment.databaseConfig.database,
    synchronize: environment.databaseConfig.synchronize,
  });

  try {
    // Test de connexion
    const connection = await mysql.createConnection({
      host: environment.databaseConfig.host,
      port: environment.databaseConfig.port,
      user: environment.databaseConfig.username,
      password: environment.databaseConfig.password,
      database: environment.databaseConfig.database,
    });

    console.log('✅ Connexion à la base de données réussie');

    // Vérifier les tables existantes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables existantes:', tables.length);
    
    if (tables.length > 0) {
      console.log('Tables:', tables.map(t => Object.values(t)[0]));
    } else {
      console.log('⚠️  Aucune table trouvée - synchronize devrait créer les tables');
    }

    await connection.end();
    console.log('✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
}

checkDatabase();
