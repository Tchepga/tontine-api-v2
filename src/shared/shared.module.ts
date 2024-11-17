import { Module } from '@nestjs/common';
import { ErrorCode } from './utilities/error-code';
import { availableMemory } from 'process';
import { BasicEntity } from './utilities/basic.entity';

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
    BasicEntity,
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
    BasicEntity,
  ],
})
export class SharedModule {}
