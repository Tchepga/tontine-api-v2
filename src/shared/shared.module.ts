import { Module } from '@nestjs/common';
import { ErrorCode } from './utilities/error-code';
import { availableMemory } from 'process';
import { ActivableEntity } from './utilities/activable.entity';

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
    ActivableEntity,
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
    ActivableEntity,
  ],
})
export class SharedModule {}
