import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (process.env.SENTRY_ENABLED === 'false' || process.env.NODE_ENV !== 'production') {
    return;
  }

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || 'development',

    integrations: [
      nodeProfilingIntegration(),
      Sentry.httpIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
      Sentry.onUncaughtExceptionIntegration({
        exitEvenIfOtherHandlersAreRegistered: false,
      }),
      Sentry.onUnhandledRejectionIntegration({ mode: 'warn' }),
    ],

    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    debug: process.env.SENTRY_DEBUG === 'true',
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    Sentry.captureException(error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    Sentry.captureException(reason);
  });
}
