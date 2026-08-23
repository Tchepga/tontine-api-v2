import { SetMetadata } from '@nestjs/common';

export const SKIP_TONTINE_CONTEXT_KEY = 'skipTontineContext';
export const SkipTontineContext = () =>
  SetMetadata(SKIP_TONTINE_CONTEXT_KEY, true);
