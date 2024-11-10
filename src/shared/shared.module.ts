import { Module } from '@nestjs/common';
import { ErrorCode } from './utilities/error-code';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: 'ErrorCode',
      useValue: ErrorCode,
    },
  ],
  exports: [
    {
      provide: 'ErrorCode',
      useValue: ErrorCode,
    },
  ],
})
export class SharedModule {}
