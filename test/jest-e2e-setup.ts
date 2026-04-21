// Configuration Jest pour les tests E2E
import 'reflect-metadata';

// Configuration globale pour les tests E2E
beforeAll(() => {
  // Configuration avant tous les tests E2E
  console.log('🧪 Configuration Jest pour les tests E2E');
});

afterAll(() => {
  // Nettoyage après tous les tests E2E
  console.log('🧹 Nettoyage après les tests E2E');
});

// Configuration des timeouts pour les tests E2E (plus longs)
jest.setTimeout(30000);

// Mock global pour les variables d'environnement E2E
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-e2e';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_DATABASE = 'test_db_e2e';
process.env.PORT = '3001'; // Port différent pour éviter les conflits

// Configuration des mocks globaux pour E2E
global.console = {
  ...console,
  // Garder les logs pour le debugging E2E
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};
