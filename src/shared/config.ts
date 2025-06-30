import { environment as devEnvironment } from './environement';

// Try to import production environment, fallback to dev if not available
let prodEnvironment: typeof devEnvironment;
try {
    const prodModule = require('./environement.prod');
    prodEnvironment = prodModule.environment;
} catch (error) {
    // If production environment doesn't exist, use development
    prodEnvironment = devEnvironment;
}

export const environment = process.env.NODE_ENV === 'production'
    ? prodEnvironment
    : devEnvironment; 