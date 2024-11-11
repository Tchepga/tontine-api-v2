import { Module } from '@nestjs/common';
import { ErrorCode } from './utilities/error-code';
import { availableMemory } from 'process';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: 'ErrorCode',
      useValue: ErrorCode,
    },
    {
      provide: 'availableLanguages',
      useValue: availableMemory,
    },
  ],
  exports: [
    {
      provide: 'ErrorCode',
      useValue: ErrorCode,
    },
    {
      provide: 'availableLanguages',
      useValue: availableMemory,
    },
  ],
})
export class SharedModule {}
