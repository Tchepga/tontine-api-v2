import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Global()
@Module({
  providers: [
    {
      provide: LoggerService,
      useFactory: () => new LoggerService(),
    },
    LoggingInterceptor,
  ],
  exports: [LoggerService, LoggingInterceptor],
})
export class SharedModule {}
