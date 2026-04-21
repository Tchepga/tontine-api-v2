// Configuration Jest pour les tests unitaires
import 'reflect-metadata';

// Configuration globale pour les tests
beforeAll(() => {
  // Configuration avant tous les tests
  console.log('🧪 Configuration Jest pour les tests unitaires');
});

afterAll(() => {
  // Nettoyage après tous les tests
  console.log('🧹 Nettoyage après les tests unitaires');
});

// Configuration des timeouts
jest.setTimeout(10000);

// Mock global pour les variables d'environnement
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_DATABASE = 'test_db';

// Configuration des mocks globaux
global.console = {
  ...console,
  // Réduire le bruit dans les tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
