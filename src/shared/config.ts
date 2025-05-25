import { environment as devEnvironment } from './environement';
import { environment as prodEnvironment } from './environement.prod';

export const environment = process.env.NODE_ENV === 'production'
    ? prodEnvironment
    : devEnvironment; 