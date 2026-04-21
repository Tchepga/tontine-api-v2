import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { EmailService } from './services/email.service';

@Global()
@Module({
  providers: [
    {
      provide: LoggerService,
      useFactory: () => new LoggerService(),
    },
    LoggingInterceptor,
    EmailService,
  ],
  exports: [LoggerService, LoggingInterceptor, EmailService],
})
export class SharedModule {}
