import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'your-sentry-dsn-here',
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || 'development',
    
    // Performance monitoring
    integrations: [
      nodeProfilingIntegration(),
    ],
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set profilesSampleRate to 1.0 to profile every transaction
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Capture all errors
    beforeSend(event) {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry Event:', event);
      }
      return event;
    },
  });
}
